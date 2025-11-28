import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateExhibitPackage } from '@/app/lib/exhibit-generator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, exhibitSources } = body;

    // Validate required fields
    if (!caseId || !exhibitSources || !Array.isArray(exhibitSources)) {
      return NextResponse.json(
        { error: 'Case ID and exhibit sources are required' },
        { status: 400 }
      );
    }

    // Verify case exists
    const { data: caseData, error: caseError } = await supabase
      .from('petition_cases')
      .select('*')
      .eq('case_id', caseId)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Update case status to indicate exhibit generation started
    await supabase
      .from('petition_cases')
      .update({
        status: 'generating_exhibits',
        updated_at: new Date().toISOString(),
      })
      .eq('case_id', caseId);

    // Progress update function
    const onProgress = async (stage: string, progress: number, message: string) => {
      await supabase
        .from('petition_cases')
        .update({
          current_stage: `Exhibits: ${stage}`,
          current_message: message,
          exhibit_generation_progress: progress,
          updated_at: new Date().toISOString(),
        })
        .eq('case_id', caseId);
    };

    // Generate exhibit package in background (fire-and-forget)
    generateExhibitsInBackground(caseId, exhibitSources, onProgress);

    return NextResponse.json({
      success: true,
      caseId,
      message: 'Exhibit generation started. Check progress endpoint for status.',
      progressEndpoint: `/api/progress/${caseId}`,
    });
  } catch (error: any) {
    console.error('Error in generate-exhibits:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start exhibit generation' },
      { status: 500 }
    );
  }
}

// Background exhibit generation function
async function generateExhibitsInBackground(
  caseId: string,
  exhibitSources: any[],
  onProgress: (stage: string, progress: number, message: string) => void
) {
  try {
    // Generate exhibit package
    const exhibitPackage = await generateExhibitPackage(
      caseId,
      exhibitSources,
      onProgress
    );

    // Store exhibit package information in database
    await supabase
      .from('petition_cases')
      .update({
        status: 'completed',
        exhibit_generation_progress: 100,
        exhibit_package_url: exhibitPackage.combinedPdfUrl,
        exhibit_toc_url: exhibitPackage.tableOfContentsUrl,
        total_exhibits: exhibitPackage.totalExhibits,
        updated_at: new Date().toISOString(),
      })
      .eq('case_id', caseId);

    // Store individual exhibit records
    if (exhibitPackage.exhibits) {
      const exhibitRecords = exhibitPackage.exhibits.map((exhibit: any) => ({
        case_id: caseId,
        exhibit_number: exhibit.number,
        exhibit_label: exhibit.label,
        source_url: exhibit.sourceUrl,
        pdf_url: exhibit.pdfUrl,
        archive_url: exhibit.archiveUrl,
        page_count: exhibit.pageCount,
        file_size: exhibit.fileSize,
      }));

      await supabase.from('case_exhibits').insert(exhibitRecords);
    }

    console.log(`✅ Successfully generated exhibits for case ${caseId}`);
  } catch (error: any) {
    console.error(`❌ Error generating exhibits for case ${caseId}:`, error);

    // Update case with error
    await supabase
      .from('petition_cases')
      .update({
        status: 'exhibit_generation_failed',
        error_message: `Exhibit generation failed: ${error.message}`,
        updated_at: new Date().toISOString(),
      })
      .eq('case_id', caseId);
  }
}
