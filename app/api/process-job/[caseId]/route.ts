import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase-server';
import { generateAllDocuments } from '@/app/lib/document-generator';
import { BeneficiaryInfo } from '@/app/types';
import {
  logError,
  createSafeProgressCallback,
} from '@/app/lib/retry-helper';

export const maxDuration = 300; // 5 minutes max for Vercel Pro
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  const { caseId } = params;
  let supabase: any = null;

  console.log(`[ProcessJob] ⚡ Endpoint called for case ${caseId}`);
  
  try {
    supabase = getSupabaseClient();
    console.log(`[ProcessJob] ✅ Starting job for case ${caseId}`);

    // Get case from database
    const { data: caseData, error: caseError } = await supabase
      .from('petition_cases')
      .select('*')
      .eq('case_id', caseId)
      .single();

    if (caseError || !caseData) {
      console.error(`[ProcessJob] Case not found: ${caseId}`, caseError);
      return NextResponse.json(
        { error: 'Case not found', caseId },
        { status: 404 }
      );
    }

    // Check if already processing or completed
    if (caseData.status === 'completed') {
      return NextResponse.json({
        success: true,
        caseId,
        message: 'Case already completed',
        status: 'completed',
      });
    }

    if (caseData.status === 'generating' && caseData.progress_percentage > 5) {
      return NextResponse.json({
        success: true,
        caseId,
        message: 'Case is already being processed',
        status: 'generating',
        progress: caseData.progress_percentage,
      });
    }

    // Update status to generating
    await supabase
      .from('petition_cases')
      .update({
        status: 'generating',
        progress_percentage: 1,
        current_stage: 'Starting',
        current_message: 'Initializing document generation...',
        updated_at: new Date().toISOString(),
      })
      .eq('case_id', caseId);

    // Get URLs for this case
    const { data: urlsData } = await supabase
      .from('case_urls')
      .select('*')
      .eq('case_id', caseId);

    // Get uploaded files for this case
    const { data: filesData } = await supabase
      .from('case_files')
      .select('*')
      .eq('case_id', caseId);

    // Reconstruct beneficiary info
    const beneficiaryInfo: BeneficiaryInfo = {
      fullName: caseData.beneficiary_name,
      profession: caseData.profession,
      visaType: caseData.visa_type,
      nationality: caseData.nationality,
      currentStatus: caseData.current_status,
      fieldOfExpertise: caseData.field_of_expertise,
      backgroundInfo: caseData.background_info,
      petitionerName: caseData.petitioner_name,
      petitionerOrganization: caseData.petitioner_organization,
      additionalInfo: caseData.additional_info,
      primaryUrls: urlsData?.map((u: any) => u.url) || [],
      urls: urlsData || [],
      uploadedFiles: filesData || [],
    };

    // Progress callback - with better error handling and logging
    const updateProgress = async (stage: string, progress: number, message: string) => {
      try {
        const updateData: any = {
          status: progress === 100 ? 'completed' : 'generating',
          progress_percentage: progress,
          current_stage: stage,
          current_message: message,
          updated_at: new Date().toISOString(),
        };
        
        if (progress === 100) {
          updateData.completed_at = new Date().toISOString();
        }
        
        const { error, data } = await supabase
          .from('petition_cases')
          .update(updateData)
          .eq('case_id', caseId)
          .select();
        
        if (error) {
          console.error(`[ProcessJob] ❌ Failed to update progress for ${caseId}:`, error);
          logError('updateProgress', error, { caseId, stage, progress, message });
        } else {
          console.log(`[ProcessJob] ✅ Updated progress for ${caseId}: ${progress}% - ${stage} - ${message}`);
        }
      } catch (progressError) {
        console.error(`[ProcessJob] ❌ Exception updating progress for ${caseId}:`, progressError);
        logError('updateProgress exception', progressError, { caseId, stage, progress, message });
      }
    };

    const safeProgress = createSafeProgressCallback(updateProgress);

    // Generate all documents
    console.log(`[ProcessJob] Generating documents for ${caseId}`);
    const result = await generateAllDocuments(beneficiaryInfo, safeProgress);

    // Update progress
    await updateProgress('Saving Documents', 95, 'Saving generated markdown documents...');

    // Step 1: Upload markdown files to Supabase storage
    const documentUrls: string[] = [];
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

    // Upload markdown files to storage
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      try {
        const fileName = `document-${doc.number}-${doc.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
        const storagePath = `petitions/${caseId}/${fileName}`;
        
        console.log(`[ProcessJob] Uploading markdown file ${doc.number} (${fileName})...`);
        
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
          console.log(`[ProcessJob] ✅ Successfully uploaded markdown file ${doc.number} to: ${urlData.publicUrl}`);
        } else {
          console.error(`[ProcessJob] ❌ Failed to upload markdown file ${doc.number}:`, uploadError);
          documentUrls.push(''); // Empty string for failed uploads
        }
      } catch (uploadErr: any) {
        console.error(`[ProcessJob] ❌ Exception uploading markdown file ${doc.number}:`, uploadErr?.message || uploadErr);
        logError(`Upload markdown file ${doc.number}`, uploadErr, { caseId, docName: doc.name });
        documentUrls.push(''); // Empty string for failed uploads
      }
    }

    // Step 2: Store generated documents (markdown content and URLs) to database
    let savedCount = 0;
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const documentUrl = documentUrls[i] || '';
      
      // Construct storage path - use markdown file path
      let storagePath = `generated/${caseId}/document-${doc.number}.md`;
      if (documentUrl) {
        // Extract the storage path from the public URL
        const urlParts = documentUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        storagePath = `petitions/${caseId}/${fileName}`;
      }

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
          console.log(`[ProcessJob] ✅ Saved document ${doc.number} (${doc.name}) with markdown URL: ${documentUrl || 'N/A'}`);
          savedCount++;
        } else {
          console.error(`[ProcessJob] ❌ Database error saving document ${doc.number}:`, error);
        }

        if (!error) savedCount++;
      } catch (docError) {
        logError(`Save document ${doc.number}`, docError, { caseId, docName: doc.name });
      }
    }

    console.log(`[ProcessJob] ✅ Completed case ${caseId} - saved ${savedCount}/${documents.length} markdown documents`);

    // CRITICAL: Update final completion status - this is what the frontend checks
    await updateProgress('Complete', 100, `Successfully generated and saved ${savedCount} documents`);

    return NextResponse.json({
      success: true,
      caseId,
      message: `Successfully generated ${savedCount} documents`,
      documentsGenerated: savedCount,
    });

  } catch (error: any) {
    logError('process-job', error, { caseId });

    // Update case with error
    if (supabase) {
      try {
        await supabase
          .from('petition_cases')
          .update({
            status: 'failed',
            error_message: error.message || 'Unknown error during generation',
            updated_at: new Date().toISOString(),
          })
          .eq('case_id', caseId);
      } catch (updateError) {
        logError('Database - update failed status', updateError, { caseId });
      }
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to process job',
        caseId,
      },
      { status: 500 }
    );
  }
}
