import { inngest } from './client';
import { generateAllDocuments } from '../document-generator';
import { logError } from '../retry-helper';
import { BeneficiaryInfo } from '../../types';
import { setProgress, completeProgress, failProgress } from '../progress-store';
import { sendDocumentsEmail } from '../email-service';

// Try to get Supabase client - returns null if unavailable
function getOptionalSupabase() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return null;
    }

    const { createClient } = require('@supabase/supabase-js');
    return createClient(supabaseUrl, supabaseKey);
  } catch {
    return null;
  }
}

/**
 * Inngest function for generating visa petition documents
 *
 * This runs as a background job with NO timeout limits.
 * Can run for 15-30+ minutes without issues.
 */
export const generatePetitionFunction = inngest.createFunction(
  {
    id: 'generate-petition-documents',
    name: 'Generate Visa Petition Documents',
    // Retry configuration
    retries: 2,
    // Cancel any existing runs for the same case
    concurrency: {
      limit: 1,
      key: 'event.data.caseId',
    },
  },
  { event: 'petition/generate' },
  async ({ event, step }) => {
    const { caseId, beneficiaryInfo, urls, uploadedFiles } = event.data;

    // Try to get Supabase - returns null if not available
    const supabase = getOptionalSupabase();
    if (supabase) {
      console.log('[Inngest] Supabase connected');
    } else {
      console.log('[Inngest] Running without Supabase - using in-memory progress');
    }

    // Helper to update progress in BOTH database and in-memory store
    // PRIORITY: Database first (for real-time updates), then in-memory (for fallback)
    const updateProgress = async (stage: string, percentage: number, message: string) => {
      // Update database FIRST (this is what the frontend polls)
      if (supabase) {
        try {
          await supabase
            .from('petition_cases')
            .update({
              status: percentage === 100 ? 'completed' : percentage === 0 ? 'initializing' : 'generating',
              progress_percentage: percentage,
              current_stage: stage,
              current_message: message,
              updated_at: new Date().toISOString(),
              ...(percentage === 100 ? { completed_at: new Date().toISOString() } : {}),
            })
            .eq('case_id', caseId);
        } catch (error) {
          logError('Inngest updateProgress DB', error, { caseId, stage, percentage });
        }
      }

      // Also update in-memory store (for fallback if database fails)
      try {
        setProgress(caseId, {
          status: percentage === 100 ? 'completed' : 'generating',
          progress: percentage,
          currentStage: stage,
          currentMessage: message,
        });
      } catch (error) {
        logError('Inngest updateProgress memory', error, { caseId, stage, percentage });
      }
    };

    // Step 1: Mark as started
    await step.run('mark-started', async () => {
      console.log(`[Inngest] Starting generation for case ${caseId}`);
      await updateProgress('Starting', 1, 'Initializing document generation...');
      return { started: true };
    });

    // Step 2: Prepare beneficiary info
    const preparedInfo = await step.run('prepare-beneficiary-info', async () => {
      // Reconstruct beneficiary info with proper format
      const info: BeneficiaryInfo = {
        fullName: beneficiaryInfo.fullName,
        profession: beneficiaryInfo.profession,
        visaType: beneficiaryInfo.visaType as any,
        nationality: beneficiaryInfo.nationality,
        currentStatus: beneficiaryInfo.currentStatus,
        fieldOfExpertise: beneficiaryInfo.fieldOfExpertise,
        backgroundInfo: beneficiaryInfo.backgroundInfo,
        petitionerName: beneficiaryInfo.petitionerName,
        petitionerOrganization: beneficiaryInfo.petitionerOrganization,
        additionalInfo: beneficiaryInfo.additionalInfo,
        recipientEmail: beneficiaryInfo.recipientEmail,
        briefType: beneficiaryInfo.briefType,
        // Map URLs
        primaryUrls: urls.map((u: { url: string }) => u.url),
        urls: urls,
        // Map uploaded files
        uploadedFiles: uploadedFiles.map((f: { filename: string; fileType: string; extractedText?: string; wordCount?: number }) => ({
          filename: f.filename,
          fileType: f.fileType as any,
          extractedText: f.extractedText || '',
          wordCount: f.wordCount || 0,
        })),
      };

      return info;
    });

    // Step 3: Generate all documents (THE LONG-RUNNING PART)
    // This can take 15-30 minutes - Inngest handles it!
    const result = await step.run('generate-documents', async () => {
      console.log(`[Inngest] Generating documents for case ${caseId}...`);

      // Create progress callback that updates Supabase
      const progressCallback = async (stage: string, progress: number, message: string) => {
        await updateProgress(stage, progress, message);
      };

      // Generate all 8 documents
      // Cast to any to handle Inngest serialization of dates
      const generationResult = await generateAllDocuments(preparedInfo as any, progressCallback);

      return {
        document1: generationResult.document1,
        document2: generationResult.document2,
        document3: generationResult.document3,
        document4: generationResult.document4,
        document5: generationResult.document5,
        document6: generationResult.document6,
        document7: generationResult.document7,
        document8: generationResult.document8,
        urlsAnalyzed: generationResult.urlsAnalyzed.length,
        filesProcessed: generationResult.filesProcessed,
      };
    });

    // Step 4: Upload markdown files to storage
    const documentResults = await step.run('upload-markdown-files', async () => {
      console.log(`[Inngest] Uploading markdown files to storage for case ${caseId}...`);
      await updateProgress('Saving Documents', 95, 'Uploading markdown files to storage...');

      const documents = [
        { number: 1, name: 'Comprehensive Analysis', type: 'analysis', content: result.document1 },
        { number: 2, name: 'Publication Analysis', type: 'analysis', content: result.document2 },
        { number: 3, name: 'URL Reference', type: 'reference', content: result.document3 },
        { number: 4, name: 'Legal Brief', type: 'brief', content: result.document4 },
        { number: 5, name: 'Evidence Gap Analysis', type: 'analysis', content: result.document5 },
        { number: 6, name: 'USCIS Cover Letter', type: 'letter', content: result.document6 },
        { number: 7, name: 'Visa Checklist', type: 'checklist', content: result.document7 },
        { number: 8, name: 'Exhibit Assembly Guide', type: 'guide', content: result.document8 },
      ];

      const documentUrls: string[] = [];

      if (supabase) {
        for (let i = 0; i < documents.length; i++) {
          const doc = documents[i];
          try {
            const fileName = `document-${doc.number}-${doc.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
            const storagePath = `petitions/${caseId}/${fileName}`;
            
            console.log(`[Inngest] Uploading markdown file ${doc.number} (${fileName})...`);
            
            // Convert markdown content to Buffer for storage
            const markdownBuffer = Buffer.from(doc.content || '', 'utf-8');
            
            const { error: uploadError } = await supabase.storage
              .from('petition-documents')
              .upload(storagePath, markdownBuffer, {
                contentType: 'text/markdown',
                upsert: true,
              });

            if (!uploadError) {
              const { data: urlData } = supabase.storage
                .from('petition-documents')
                .getPublicUrl(storagePath);
              documentUrls.push(urlData.publicUrl);
              console.log(`[Inngest] ✅ Uploaded markdown file ${doc.number} to: ${urlData.publicUrl}`);
            } else {
              console.error(`[Inngest] ❌ Failed to upload markdown file ${doc.number}:`, uploadError);
              documentUrls.push(''); // Empty string for failed uploads
            }
          } catch (uploadErr) {
            logError(`Upload markdown file ${doc.number}`, uploadErr, { caseId, docName: doc.name });
            documentUrls.push(''); // Empty string for failed uploads
          }
        }
      }

      return { documents, documentUrls };
    });

    // Step 5: Save documents (markdown content and URLs) to database
    await step.run('save-documents', async () => {
      if (!supabase) {
        console.log('[Inngest] Skipping database save - Supabase not available');
        return { saved: false };
      }

      console.log(`[Inngest] Saving documents to database for case ${caseId}...`);

      const documents = documentResults.documents;
      const documentUrls = documentResults.documentUrls;

      let savedCount = 0;
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        const documentUrl = documentUrls[i] || '';
        const storagePath = documentUrl ? documentUrl.split('/').slice(-2).join('/') : `generated/${caseId}/document-${doc.number}.md`;

        try {
          // Save document with markdown URL
          const { error } = await supabase
            .from('generated_documents')
            .upsert({
              case_id: caseId,
              document_number: doc.number,
              document_name: doc.name,
              document_type: doc.type,
              content: doc.content, // Markdown content
              word_count: doc.content?.split(/\s+/).length || 0,
              page_estimate: Math.ceil((doc.content?.split(/\s+/).length || 0) / 500),
              storage_path: storagePath,
              storage_url: documentUrl || `generated/${caseId}/document-${doc.number}.md`, // Markdown file URL
              file_size_bytes: Buffer.from(doc.content || '', 'utf-8').length,
              generated_at: new Date().toISOString(),
            }, {
              onConflict: 'case_id,document_number',
            });

          if (!error) {
            console.log(`[Inngest] ✅ Saved document ${doc.number} (${doc.name}) with markdown URL: ${documentUrl || 'N/A'}`);
            savedCount++;
          } else {
            console.error(`[Inngest] ❌ Database error saving document ${doc.number}:`, error);
          }
        } catch (docError) {
          logError(`Save document ${doc.number}`, docError, { caseId, docName: doc.name });
        }
      }

      console.log(`[Inngest] Saved ${savedCount}/${documents.length} markdown documents for case ${caseId}`);
      return { saved: true, count: savedCount };
    });

    // Step 6: Mark as completed and store in-memory results
    await step.run('mark-completed', async () => {
      console.log(`[Inngest] Marking case ${caseId} as completed`);

      // Store documents in in-memory progress for retrieval
      const documents = [
        { name: 'Comprehensive Analysis', content: result.document1, pageCount: Math.ceil((result.document1?.split(/\s+/).length || 0) / 500), wordCount: result.document1?.split(/\s+/).length || 0 },
        { name: 'Publication Analysis', content: result.document2, pageCount: Math.ceil((result.document2?.split(/\s+/).length || 0) / 500), wordCount: result.document2?.split(/\s+/).length || 0 },
        { name: 'URL Reference', content: result.document3, pageCount: Math.ceil((result.document3?.split(/\s+/).length || 0) / 500), wordCount: result.document3?.split(/\s+/).length || 0 },
        { name: 'Legal Brief', content: result.document4, pageCount: Math.ceil((result.document4?.split(/\s+/).length || 0) / 500), wordCount: result.document4?.split(/\s+/).length || 0 },
        { name: 'Evidence Gap Analysis', content: result.document5, pageCount: Math.ceil((result.document5?.split(/\s+/).length || 0) / 500), wordCount: result.document5?.split(/\s+/).length || 0 },
        { name: 'USCIS Cover Letter', content: result.document6, pageCount: Math.ceil((result.document6?.split(/\s+/).length || 0) / 500), wordCount: result.document6?.split(/\s+/).length || 0 },
        { name: 'Visa Checklist', content: result.document7, pageCount: Math.ceil((result.document7?.split(/\s+/).length || 0) / 500), wordCount: result.document7?.split(/\s+/).length || 0 },
        { name: 'Exhibit Assembly Guide', content: result.document8, pageCount: Math.ceil((result.document8?.split(/\s+/).length || 0) / 500), wordCount: result.document8?.split(/\s+/).length || 0 },
      ];

      // Update in-memory store with completed status and documents
      completeProgress(caseId, documents);

      // Also update database
      if (supabase) {
        await supabase
          .from('petition_cases')
          .update({
            status: 'completed',
            progress_percentage: 100,
            current_stage: 'Complete',
            current_message: 'All 8 documents generated successfully!',
            completed_at: new Date().toISOString(),
          })
          .eq('case_id', caseId);
      }

      return { completed: true, documentCount: documents.length };
    });

    // Step 7: Send email with documents (if email provided)
    await step.run('send-email', async () => {
      if (!beneficiaryInfo.recipientEmail) {
        console.log(`[Inngest] No recipient email provided, skipping email send`);
        return { sent: false, reason: 'no-email' };
      }

      console.log(`[Inngest] Sending documents to ${beneficiaryInfo.recipientEmail}`);

      try {
        const documents = [
          { name: 'Document 1 - Comprehensive Analysis', content: result.document1, pageCount: Math.ceil((result.document1?.split(/\s+/).length || 0) / 500) },
          { name: 'Document 2 - Publication Analysis', content: result.document2, pageCount: Math.ceil((result.document2?.split(/\s+/).length || 0) / 500) },
          { name: 'Document 3 - URL Reference', content: result.document3, pageCount: Math.ceil((result.document3?.split(/\s+/).length || 0) / 500) },
          { name: 'Document 4 - Legal Brief', content: result.document4, pageCount: Math.ceil((result.document4?.split(/\s+/).length || 0) / 500) },
          { name: 'Document 5 - Evidence Gap Analysis', content: result.document5, pageCount: Math.ceil((result.document5?.split(/\s+/).length || 0) / 500) },
          { name: 'Document 6 - USCIS Cover Letter', content: result.document6, pageCount: Math.ceil((result.document6?.split(/\s+/).length || 0) / 500) },
          { name: 'Document 7 - Visa Checklist', content: result.document7, pageCount: Math.ceil((result.document7?.split(/\s+/).length || 0) / 500) },
          { name: 'Document 8 - Exhibit Assembly Guide', content: result.document8, pageCount: Math.ceil((result.document8?.split(/\s+/).length || 0) / 500) },
        ];

        // Reconstruct beneficiary info for email
        const emailBeneficiaryInfo: BeneficiaryInfo = {
          fullName: beneficiaryInfo.fullName,
          profession: beneficiaryInfo.profession,
          visaType: beneficiaryInfo.visaType,
          recipientEmail: beneficiaryInfo.recipientEmail,
          briefType: beneficiaryInfo.briefType,
        };

        const emailSent = await sendDocumentsEmail(emailBeneficiaryInfo, documents);

        if (emailSent) {
          console.log(`[Inngest] Email sent successfully to ${beneficiaryInfo.recipientEmail}`);
          return { sent: true, email: beneficiaryInfo.recipientEmail };
        } else {
          console.warn(`[Inngest] Email sending returned false`);
          return { sent: false, reason: 'send-failed' };
        }
      } catch (emailError) {
        logError('Inngest send-email', emailError, { caseId, email: beneficiaryInfo.recipientEmail });
        return { sent: false, reason: 'error', error: String(emailError) };
      }
    });

    // Return summary
    return {
      success: true,
      caseId,
      documentsGenerated: 8,
      urlsAnalyzed: result.urlsAnalyzed,
      filesProcessed: result.filesProcessed,
      message: 'All documents generated successfully',
    };
  }
);

// Export all functions for the Inngest serve handler
export const inngestFunctions = [generatePetitionFunction];
