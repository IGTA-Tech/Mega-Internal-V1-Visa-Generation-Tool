import { NextRequest, NextResponse } from 'next/server';
import {
  logError,
  validateRequiredFields,
  retryWithBackoff,
} from '@/app/lib/retry-helper';
import { initProgress, setProgress } from '@/app/lib/progress-store';

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

export async function POST(request: NextRequest) {
  let caseId: string | null = null;

  // Try to get Supabase - returns null if not available
  const supabase = getOptionalSupabase();
  if (supabase) {
    console.log('[Generate] Supabase connected successfully');
  } else {
    console.log('[Generate] Supabase not available - using in-memory progress tracking');
  }

  try {
    const body = await request.json();
    const { beneficiaryInfo, urls, uploadedFiles } = body;

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

    // Always initialize in-memory progress (works even without Supabase)
    initProgress(caseId);
    console.log(`[Generate] Initialized in-memory progress for ${caseId}`);

    // Create case in database with error handling (if Supabase available)
    if (supabase) {
      try {
        const { error: caseError } = await supabase
          .from('petition_cases')
          .insert({
            case_id: caseId,
            beneficiary_name: beneficiaryInfo.fullName,
            profession: beneficiaryInfo.profession || beneficiaryInfo.fieldOfProfession || 'Not specified',
            visa_type: beneficiaryInfo.visaType,
            nationality: beneficiaryInfo.nationality,
            current_status: beneficiaryInfo.currentStatus,
            field_of_expertise: beneficiaryInfo.fieldOfExpertise || beneficiaryInfo.profession || beneficiaryInfo.fieldOfProfession,
            background_info: beneficiaryInfo.backgroundInfo || beneficiaryInfo.background,
            petitioner_name: beneficiaryInfo.petitionerName,
            petitioner_organization: beneficiaryInfo.petitionerOrganization,
            additional_info: beneficiaryInfo.additionalInfo,
            status: 'initializing',
            progress_percentage: 0,
            current_stage: 'Queued for processing',
            current_message: 'Your petition is queued and will start processing shortly...',
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

    // Store uploaded files metadata in database (if Supabase available)
    if (uploadedFiles && uploadedFiles.length > 0 && supabase) {
      try {
        const fileRecords = uploadedFiles.map((file: any) => ({
          case_id: caseId,
          filename: file.filename || file.name,
          file_type: file.fileType || file.type || 'pdf',
          file_size_bytes: file.size || 0,
          mime_type: file.mimeType,
          extracted_text: file.extractedText,
          word_count: file.wordCount,
          processing_status: 'completed',
          storage_path: `uploads/${caseId}/${file.filename || file.name}`,
        }));

        await supabase.from('case_files').insert(fileRecords);
        console.log(`[Generate] Stored ${fileRecords.length} file records in database`);
      } catch (fileError: any) {
        logError('Database - store files', fileError, { caseId });
      }
    }

    // TRIGGER DIRECT PROCESSING
    // Always use direct processing (process-job endpoint) for document generation
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    console.log(`[Generate] Triggering direct processing for case ${caseId}`);
    
    // Update status
    if (supabase) {
      await supabase
        .from('petition_cases')
        .update({
          status: 'researching',
          progress_percentage: 5,
          current_stage: 'Processing',
          current_message: 'Document generation started (direct processing)...',
          updated_at: new Date().toISOString(),
        })
        .eq('case_id', caseId);
    }

    // Trigger process-job endpoint in background (fire-and-forget)
    // Try to get the actual URL from request, environment, or use localhost
    let baseUrl: string;
    
    // Get the host from the request if available
    const requestHost = request.headers.get('host');
    const requestProtocol = request.headers.get('x-forwarded-proto') || 
                           (request.url.startsWith('https') ? 'https' : 'http');
    
    if (isDevelopment) {
      // In development, try to use the request host first, then fallback to localhost
      // This helps avoid issues with server-side fetch to localhost
      if (requestHost) {
        baseUrl = `http://${requestHost}`;
        console.log(`[Generate] Development mode: Using request host for process-job: ${baseUrl}`);
      } else {
        baseUrl = 'http://localhost:3000';
        console.log(`[Generate] Development mode: Using localhost for process-job`);
      }
    } else {
      // In production, try multiple sources
      let prodUrl = process.env.NEXT_PUBLIC_APP_URL;
      
      // Check if it's a placeholder
      if (!prodUrl || prodUrl.includes('your-cloud-run-url') || prodUrl.includes('placeholder') || prodUrl.includes('example.com')) {
        // Try VERCEL_URL
        if (process.env.VERCEL_URL) {
          prodUrl = `https://${process.env.VERCEL_URL}`;
        }
        // Try request host
        else if (requestHost) {
          prodUrl = `${requestProtocol}://${requestHost}`;
        }
        // Fallback to localhost (shouldn't happen in production)
        else {
          prodUrl = 'http://localhost:3000';
          console.warn(`[Generate] No valid production URL found, using localhost`);
        }
      } else {
        // Make sure it has protocol
        if (!prodUrl.startsWith('http')) {
          prodUrl = `https://${prodUrl}`;
        }
      }
      
      baseUrl = prodUrl;
    }
    
    const url = `${baseUrl}/api/process-job/${caseId}`;
    console.log(`[Generate] Triggering process-job at: ${url}`);
    
    // Trigger in background without blocking
    (async () => {
      // Add a small delay to ensure database transaction is committed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        await retryWithBackoff(
          async () => {
            // Use longer timeout in development since server-side fetch can be slower
            const timeoutMs = isDevelopment ? 60000 : 30000; // 60s dev, 30s prod
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            
            try {
              console.log(`[Generate] Calling process-job: ${url} (timeout: ${timeoutMs}ms)`);
              
              const response = await fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                signal: controller.signal,
              });
              
              clearTimeout(timeoutId);
              
              if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                const error = new Error(`process-job returned ${response.status}: ${errorText}`);
                (error as any).status = response.status;
                throw error;
              }
              
              const result = await response.json().catch(() => ({}));
              console.log(`[Generate] ✅ process-job triggered successfully for case ${caseId}`, result);
              return result;
            } catch (fetchErr: any) {
              clearTimeout(timeoutId);
              throw fetchErr;
            }
          },
          {
            maxRetries: 3,
            initialDelay: 2000, // 2 seconds
            maxDelay: 10000, // 10 seconds
          }
        );
      } catch (err: any) {
        // All retries failed - log the error
        logError('process-job fetch', err, { caseId, url });
        console.error(`[Generate] ❌ Failed to trigger process-job after retries for case ${caseId}`);
        console.error(`[Generate] URL attempted: ${url}`);
        console.error(`[Generate] Error: ${err?.message || err}`);
        
        // Update case status to indicate processing failed to start
        if (supabase) {
          try {
            await supabase
              .from('petition_cases')
              .update({
                status: 'failed',
                error_message: `Failed to start processing: ${err?.message || 'Unknown error'}`,
                updated_at: new Date().toISOString(),
              })
              .eq('case_id', caseId);
          } catch (updateErr) {
            logError('Database - update failed status after fetch error', updateErr, { caseId });
          }
        }
        
        // If it's a fetch error in development, provide helpful message
        if (isDevelopment) {
          const isAbortError = err?.message?.includes('aborted') || err?.code === 20 || err?.code === '20';
          const isFetchError = err?.message?.includes('fetch failed');
          
          if (isAbortError || isFetchError) {
            console.error(`[Generate] ⚠️  Development mode: Server-side fetch failed`);
            console.error(`[Generate] ⚠️  This is common in Next.js when routes fetch to themselves.`);
            console.error(`[Generate] ⚠️  Solutions:`);
            console.error(`[Generate] ⚠️  1. Manually trigger: POST ${url}`);
            console.error(`[Generate] ⚠️  2. The job may still process if you manually call the endpoint`);
          }
        }
      }
    })();

    return NextResponse.json({
      success: true,
      caseId,
      message: 'Document generation started! This will take 15-30 minutes.',
      progressEndpoint: `/api/progress/${caseId}`,
      status: 'processing',
      estimatedTime: '15-30 minutes',
      mode: 'direct',
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
