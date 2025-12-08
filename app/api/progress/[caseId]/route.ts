import { NextRequest, NextResponse } from 'next/server';
import { getProgress } from '@/app/lib/progress-store';

// Ensure route is always dynamic and never cached
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const { caseId } = params;

    // First, try to get from in-memory store (always available)
    const inMemoryProgress = getProgress(caseId);

    // Try Supabase if available
    const supabase = getOptionalSupabase();

    if (supabase) {
      try {
        // Get case progress from database
        const { data: caseData, error: caseError } = await supabase
          .from('petition_cases')
          .select('*')
          .eq('case_id', caseId)
          .single();

        if (caseError) {
          // Log the specific error
          console.log(`[Progress] Database query error for ${caseId}:`, caseError.code, caseError.message);
          // Continue to check in-memory
        } else if (caseData) {
          // Case found in database - return it
          console.log(`[Progress] Found case ${caseId} in database: status=${caseData.status}, progress=${caseData.progress_percentage}%`);

          // Get documents from database - check if they exist regardless of status
          // This handles cases where documents are generated but status wasn't updated
          let documents = null;
          const { data: docsData, error: docsError } = await supabase
            .from('generated_documents')
            .select('*')
            .eq('case_id', caseId)
            .order('document_number');

          if (docsError) {
            console.error(`[Progress] Error fetching documents for ${caseId}:`, docsError);
          } else if (docsData && docsData.length > 0) {
            documents = docsData;
            console.log(`[Progress] Found ${docsData.length} documents for ${caseId}`);
            
            // If documents exist but status isn't completed, update it
            if (caseData.status !== 'completed' && docsData.length >= 8) {
              console.log(`[Progress] Documents exist but status is ${caseData.status}, updating to completed`);
              await supabase
                .from('petition_cases')
                .update({
                  status: 'completed',
                  progress_percentage: 100,
                  current_stage: 'Complete',
                  current_message: `Successfully generated ${docsData.length} documents`,
                  completed_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('case_id', caseId);
              
              // Update caseData for response
              caseData.status = 'completed';
              caseData.progress_percentage = 100;
              caseData.current_stage = 'Complete';
              caseData.current_message = `Successfully generated ${docsData.length} documents`;
            }
          }

          return NextResponse.json(
            {
              success: true,
              caseId,
              status: caseData.status || 'initializing',
              progress: caseData.progress_percentage ?? 0,
              currentStage: caseData.current_stage || 'Processing',
              currentMessage: caseData.current_message || 'Initializing...',
              errorMessage: caseData.error_message || null,
              createdAt: caseData.created_at,
              completedAt: caseData.completed_at || null,
              documents,
              source: 'database',
            },
            {
              // Prevent any caching so the UI sees latest progress
              headers: {
                'Cache-Control': 'no-store, must-revalidate',
              },
            }
          );
        } else {
          // No case data returned (shouldn't happen with single(), but handle it)
          console.log(`[Progress] Case ${caseId} query returned no data`);
        }
      } catch (dbError: any) {
        console.warn(`[Progress] Database exception for ${caseId}:`, dbError?.message || dbError);
        // Fall through to in-memory store
      }
    }

    // Use in-memory store as fallback
    if (inMemoryProgress) {
      console.log(`[Progress] Returning in-memory progress for ${caseId}: ${inMemoryProgress.progress}%`);

      return NextResponse.json(
        {
          success: true,
          caseId,
          status: inMemoryProgress.status,
          progress: inMemoryProgress.progress,
          currentStage: inMemoryProgress.currentStage,
          currentMessage: inMemoryProgress.currentMessage,
          errorMessage: inMemoryProgress.errorMessage,
          createdAt: inMemoryProgress.createdAt,
          completedAt: inMemoryProgress.completedAt,
          documents: inMemoryProgress.documents,
          source: 'memory',
        },
        {
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
          },
        }
      );
    }

    // Case not found in either store
    console.log(`[Progress] Case ${caseId} not found in database or memory`);
    return NextResponse.json(
      { error: 'Case not found', caseId },
      { status: 404 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get progress';
    console.error('[Progress] Error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
