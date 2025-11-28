import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const supabase = getSupabaseClient();
    const { caseId } = params;

    // Get case progress
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

    // If completed, get documents
    let documents = null;
    if (caseData.status === 'completed') {
      const { data: docsData } = await supabase
        .from('generated_documents')
        .select('*')
        .eq('case_id', caseId)
        .order('document_number');

      documents = docsData;
    }

    return NextResponse.json({
      success: true,
      caseId,
      status: caseData.status,
      progress: caseData.progress_percentage,
      currentStage: caseData.current_stage,
      currentMessage: caseData.current_message,
      errorMessage: caseData.error_message,
      createdAt: caseData.created_at,
      completedAt: caseData.completed_at,
      documents,
    });
  } catch (error: any) {
    console.error('Error in progress:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get progress' },
      { status: 500 }
    );
  }
}
