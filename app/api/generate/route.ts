import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAllDocuments } from '@/app/lib/document-generator';
import { BeneficiaryInfo } from '@/app/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { beneficiaryInfo, urls, files } = body;

    // Validate required fields
    if (!beneficiaryInfo || !beneficiaryInfo.fullName || !beneficiaryInfo.visaType) {
      return NextResponse.json(
        { error: 'Beneficiary name and visa type are required' },
        { status: 400 }
      );
    }

    // Generate case ID
    const caseId = generateCaseId(beneficiaryInfo.fullName);

    // Create case in database
    const { data: caseData, error: caseError } = await supabase
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

    // Store URLs in database
    if (urls && urls.length > 0) {
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
    }

    // Start generation in background (fire-and-forget)
    generateDocumentsInBackground(caseId, beneficiaryInfo, urls || []);

    return NextResponse.json({
      success: true,
      caseId,
      message: 'Generation started. Check progress endpoint for status.',
      progressEndpoint: `/api/progress/${caseId}`,
    });
  } catch (error: any) {
    console.error('Error in generate:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start generation' },
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
  urls: any[]
) {
  try {
    // Update progress function
    const updateProgress = async (stage: string, progress: number, message: string) => {
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
    };

    // Prepare beneficiary info with URLs
    const enrichedBeneficiaryInfo = {
      ...beneficiaryInfo,
      primaryUrls: urls.map((u: any) => u.url || u),
      urls: urls,
    };

    // Generate all documents
    const result = await generateAllDocuments(enrichedBeneficiaryInfo, updateProgress);

    // Store generated documents
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

    for (const doc of documents) {
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
    }

    console.log(`✅ Successfully generated all documents for case ${caseId}`);
  } catch (error: any) {
    console.error(`❌ Error generating documents for case ${caseId}:`, error);

    // Update case with error
    await supabase
      .from('petition_cases')
      .update({
        status: 'failed',
        error_message: error.message,
        updated_at: new Date().toISOString(),
      })
      .eq('case_id', caseId);
  }
}
