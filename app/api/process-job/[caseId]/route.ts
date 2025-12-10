import { NextRequest, NextResponse } from 'next/server';
import { generateAllDocuments } from '@/app/lib/document-generator';
import { BeneficiaryInfo } from '@/app/types';
import {
  logError,
  createSafeProgressCallback,
} from '@/app/lib/retry-helper';
import { sendDocumentsEmail } from '@/app/lib/email-service';

export const maxDuration = 300; // 5 minutes max for Vercel Pro
export const dynamic = 'force-dynamic';

// Try to get Supabase client - returns null if unavailable
function getOptionalSupabase() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[ProcessJob] ❌ Supabase credentials missing:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        envKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE')),
      });
      return null;
    }

    const { createClient } = require('@supabase/supabase-js');
    const client = createClient(supabaseUrl, supabaseKey);
    console.log('[ProcessJob] ✅ Supabase client created successfully');
    return client;
  } catch (error: any) {
    console.error('[ProcessJob] ❌ Failed to create Supabase client:', error?.message || error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  const { caseId } = params;
  let supabase: any = null;

  console.log(`[ProcessJob] ⚡ Endpoint called for case ${caseId}`);
  
  // Log environment info for debugging - more detailed
  const allEnvKeys = Object.keys(process.env);
  const supabaseKeys = allEnvKeys.filter(k => k.includes('SUPABASE'));
  const publicKeys = allEnvKeys.filter(k => k.startsWith('NEXT_PUBLIC_'));
  
  // Check for common typos or variations
  const possibleUrlKeys = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE',
  ];
  const foundUrlKey = possibleUrlKeys.find(key => process.env[key]);
  
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) || 'not set',
    supabaseKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || 'not set',
    allSupabaseKeys: supabaseKeys,
    allPublicKeys: publicKeys,
    foundUrlKey: foundUrlKey || 'none',
    totalEnvVars: allEnvKeys.length,
    // Show all env keys that might be related
    relatedKeys: allEnvKeys.filter(k => 
      k.includes('SUPABASE') || 
      k.includes('DATABASE') || 
      k.includes('URL')
    ),
  };
  console.log(`[ProcessJob] Environment check:`, JSON.stringify(envInfo, null, 2));
  
  // Also log the actual values (truncated) to help debug
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log(`[ProcessJob] ✅ NEXT_PUBLIC_SUPABASE_URL is set: ${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 50)}...`);
  } else {
    console.error(`[ProcessJob] ❌ NEXT_PUBLIC_SUPABASE_URL is NOT set`);
    // Check if it exists with a different name
    if (foundUrlKey && foundUrlKey !== 'NEXT_PUBLIC_SUPABASE_URL') {
      console.error(`[ProcessJob] ⚠️  Found similar key: ${foundUrlKey} = ${process.env[foundUrlKey]?.substring(0, 50)}...`);
    }
  }
  
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(`[ProcessJob] ✅ SUPABASE_SERVICE_ROLE_KEY is set: ${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);
  } else {
    console.error(`[ProcessJob] ❌ SUPABASE_SERVICE_ROLE_KEY is NOT set`);
  }
  
  // Log ALL environment variable names (to help spot typos)
  console.log(`[ProcessJob] All environment variable names (${allEnvKeys.length} total):`, allEnvKeys.sort().join(', '));
  
  try {
    supabase = getOptionalSupabase();
    
    if (!supabase) {
      const errorMsg = 'Supabase credentials are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.';
      console.error(`[ProcessJob] ❌ ${errorMsg}`);
      console.error(`[ProcessJob] Environment details:`, envInfo);
      return NextResponse.json(
        {
          error: errorMsg,
          caseId,
          details: 'Check Cloud Run environment variables configuration. Ensure secrets are properly mounted via --set-secrets.',
          environmentCheck: {
            hasUrl: envInfo.hasSupabaseUrl,
            hasKey: envInfo.hasSupabaseKey,
            availableKeys: envInfo.allSupabaseKeys,
          },
        },
        { status: 500 }
      );
    }
    
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
      recipientEmail: caseData.recipient_email,
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
      } catch (docError) {
        logError(`Save document ${doc.number}`, docError, { caseId, docName: doc.name });
      }
    }

    // Step 3: Send documents via email if configured
    let emailSent = false;
    if (beneficiaryInfo.recipientEmail) {
      if (process.env.SENDGRID_API_KEY) {
        try {
          console.log(`[ProcessJob] 📧 Sending documents email to ${beneficiaryInfo.recipientEmail}`);
          const emailDocuments = documents.map((doc, idx) => ({
            name: `Document ${doc.number} - ${doc.name}`,
            content: doc.content || '',
            pageCount: Math.ceil((doc.content?.split(/\s+/).length || 0) / 500),
          }));

          emailSent = await sendDocumentsEmail(beneficiaryInfo, emailDocuments);
          console.log(`[ProcessJob] 📧 Email send result for ${beneficiaryInfo.recipientEmail}: ${emailSent ? 'sent' : 'failed'}`);
        } catch (emailError) {
          console.error(`[ProcessJob] ❌ Failed to send email to ${beneficiaryInfo.recipientEmail}:`, emailError);
          logError('process-job send email', emailError, { caseId, email: beneficiaryInfo.recipientEmail });
        }
      } else {
        console.warn('[ProcessJob] ⚠️ SENDGRID_API_KEY not set; skipping email send');
      }
    } else {
      console.log('[ProcessJob] No recipientEmail on case; skipping email send');
    }

    console.log(`[ProcessJob] ✅ Completed case ${caseId} - saved ${savedCount}/${documents.length} markdown documents`);

    // CRITICAL: Update final completion status - this is what the frontend checks
    const completionMessage = `Successfully generated and saved ${savedCount} documents${emailSent ? ' (email sent)' : ''}`;
    await updateProgress('Complete', 100, completionMessage);

    return NextResponse.json({
      success: true,
      caseId,
      message: completionMessage,
      documentsGenerated: savedCount,
      emailSent,
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
