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

    // Helper to update progress in BOTH in-memory store and database
    const updateProgress = async (stage: string, percentage: number, message: string) => {
      // Always update in-memory store
      setProgress(caseId, {
        status: percentage === 100 ? 'completed' : 'generating',
        progress: percentage,
        currentStage: stage,
        currentMessage: message,
      });

      // Also update database if available
      if (supabase) {
        try {
          await supabase
            .from('petition_cases')
            .update({
              status: percentage === 100 ? 'completed' : 'generating',
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

    // Step 4: Save documents to database
    await step.run('save-documents', async () => {
      if (!supabase) {
        console.log('[Inngest] Skipping database save - Supabase not available');
        return { saved: false };
      }

      console.log(`[Inngest] Saving documents for case ${caseId}...`);

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

      let savedCount = 0;
      for (const doc of documents) {
        try {
          const { error } = await supabase
            .from('generated_documents')
            .upsert({
              case_id: caseId,
              document_number: doc.number,
              document_name: doc.name,
              document_type: doc.type,
              content: doc.content,
              word_count: doc.content?.split(/\s+/).length || 0,
              page_estimate: Math.ceil((doc.content?.split(/\s+/).length || 0) / 500),
              storage_url: `generated/${caseId}/document-${doc.number}.md`,
              generated_at: new Date().toISOString(),
            }, {
              onConflict: 'case_id,document_number',
            });

          if (!error) savedCount++;
        } catch (docError) {
          logError(`Save document ${doc.number}`, docError, { caseId, docName: doc.name });
        }
      }

      console.log(`[Inngest] Saved ${savedCount}/${documents.length} documents for case ${caseId}`);
      return { saved: true, count: savedCount };
    });

    // Step 5: Mark as completed and store in-memory results
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

    // Step 6: Send email with documents (if email provided)
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
