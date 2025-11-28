import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase-server';
import { generateAllDocuments } from '@/app/lib/document-generator';
import { BeneficiaryInfo } from '@/app/types';
import {
  logError,
  validateRequiredFields,
  createSafeProgressCallback,
} from '@/app/lib/retry-helper';

export async function POST(request: NextRequest) {
  let caseId: string | null = null;
  let supabase: any = null;

  // Try to initialize Supabase, but don't fail if it's not configured
  try {
    supabase = getSupabaseClient();
    console.log('[Generate] Supabase connected successfully');
  } catch (supabaseError: any) {
    console.warn('[Generate] Supabase not available:', supabaseError.message);
    console.warn('[Generate] Continuing without database - documents will still generate');
  }

  try {
    const body = await request.json();
    const { beneficiaryInfo, urls } = body;

    // Validate required fields
    const validation = validateRequiredFields(
      beneficiaryInfo,
      ['fullName', 'visaType'],
      'beneficiaryInfo'
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: `Missing required fields: ${validation.missing.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`[Generate] Starting generation for ${beneficiaryInfo.fullName}`);

    // Generate case ID
    caseId = generateCaseId(beneficiaryInfo.fullName);
    console.log(`[Generate] Generated case ID: ${caseId}`);

    // Create case in database with error handling (if Supabase available)
    if (supabase) {
      try {
        const { error: caseError } = await supabase
          .from('petition_cases')
          .insert({
            case_id: caseId,
            beneficiary_name: beneficiaryInfo.fullName,
            profession: beneficiaryInfo.profession,
            visa_type: beneficiaryInfo.visaType,
            nationality: beneficiaryInfo.nationality,
            current_status: beneficiaryInfo.currentStatus,
            field_of_expertise: beneficiaryInfo.fieldOfExpertise || beneficiaryInfo.profession,
            background_info: beneficiaryInfo.backgroundInfo,
            petitioner_name: beneficiaryInfo.petitionerName,
            petitioner_organization: beneficiaryInfo.petitionerOrganization,
            additional_info: beneficiaryInfo.additionalInfo,
            status: 'initializing',
            progress_percentage: 0,
            current_stage: 'Starting generation',
          })
          .select()
          .single();

        if (caseError) {
          throw new Error(`Failed to create case: ${caseError.message}`);
        }

        console.log(`[Generate] Case created in database: ${caseId}`);
      } catch (dbError: any) {
        logError('Database - create case', dbError, { caseId });
        // Continue even if database write fails - we'll try to save results later
      }
    } else {
      console.log('[Generate] Skipping database case creation (Supabase not available)');
    }

    // Store URLs in database with error handling (if Supabase available)
    if (urls && urls.length > 0 && supabase) {
      try {
        const urlRecords = urls.map((url: any) => ({
          case_id: caseId,
          url: url.url || url,
          title: url.title,
          description: url.description,
          source_type: url.sourceType || 'manual',
          source_name: url.sourceName,
          quality_tier: url.tier || url.sourceTier,
        }));

        await supabase.from('case_urls').insert(urlRecords);
        console.log(`[Generate] Stored ${urlRecords.length} URLs in database`);
      } catch (urlError: any) {
        logError('Database - store URLs', urlError, { caseId });
        // Continue even if URL storage fails
      }
    }

    // Start generation in background (fire-and-forget)
    generateDocumentsInBackground(caseId, beneficiaryInfo, urls || [], supabase);

    return NextResponse.json({
      success: true,
      caseId,
      message: 'Generation started. Check progress endpoint for status.',
      progressEndpoint: `/api/progress/${caseId}`,
    });
  } catch (error: any) {
    logError('generate POST', error, { caseId });

    // Update case with error if we have a caseId and Supabase
    if (caseId && supabase) {
      try {
        await supabase
          .from('petition_cases')
          .update({
            status: 'failed',
            error_message: error.message || 'Failed to start generation',
            updated_at: new Date().toISOString(),
          })
          .eq('case_id', caseId);
      } catch (updateError) {
        logError('Database - update error status', updateError);
      }
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to start generation',
        caseId: caseId || null,
      },
      { status: 500 }
    );
  }
}

// Helper function to generate case ID
function generateCaseId(name: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const nameHash = name
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 4)
    .toUpperCase();
  return `${nameHash}${timestamp}`;
}

// Background generation function
async function generateDocumentsInBackground(
  caseId: string,
  beneficiaryInfo: BeneficiaryInfo,
  urls: any[],
  supabase: any = null
) {

  try {
    console.log(`[Background] Starting background generation for case ${caseId}`);

    // Update progress function with error handling (if Supabase available)
    const updateProgress = async (stage: string, progress: number, message: string) => {
      if (!supabase) {
        console.log(`[Progress] ${stage} - ${progress}% - ${message}`);
        return;
      }

      try {
        await supabase
          .from('petition_cases')
          .update({
            status: progress === 100 ? 'completed' : 'generating',
            progress_percentage: progress,
            current_stage: stage,
            current_message: message,
            updated_at: new Date().toISOString(),
            completed_at: progress === 100 ? new Date().toISOString() : null,
          })
          .eq('case_id', caseId);
      } catch (progressError) {
        logError('updateProgress', progressError, { caseId, stage, progress });
        // Don't throw - just log and continue
      }
    };

    // Create safe progress callback
    const safeProgress = createSafeProgressCallback(updateProgress);

    // Prepare beneficiary info with URLs
    const enrichedBeneficiaryInfo = {
      ...beneficiaryInfo,
      primaryUrls: urls.map((u: any) => u.url || u),
      urls: urls,
    };

    // Generate all documents with safe progress
    const result = await generateAllDocuments(enrichedBeneficiaryInfo, safeProgress);

    // Store generated documents with error handling
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

    // Save to database if Supabase available
    if (supabase) {
      for (const doc of documents) {
        try {
          await supabase.from('generated_documents').insert({
            case_id: caseId,
            document_number: doc.number,
            document_name: doc.name,
            document_type: doc.type,
            content: doc.content,
            word_count: doc.content.split(/\s+/).length,
            page_estimate: Math.ceil(doc.content.split(/\s+/).length / 500),
            storage_url: `generated/${caseId}/document-${doc.number}.md`,
          });
          savedCount++;
        } catch (docError) {
          logError(`Save document ${doc.number}`, docError, { caseId, docName: doc.name });
          // Continue saving other documents
        }
      }
      console.log(`✅ Successfully generated and saved ${savedCount}/${documents.length} documents to database for case ${caseId}`);
    } else {
      console.log(`✅ Successfully generated ${documents.length} documents for case ${caseId} (not saved to database - Supabase not available)`);
    }
  } catch (error: any) {
    logError('generateDocumentsInBackground', error, { caseId });

    // Update case with error - use safe approach (if Supabase available)
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
  }
}
