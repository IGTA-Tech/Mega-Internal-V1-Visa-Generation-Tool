import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase-server';
import { processFile } from '@/app/lib/file-processor';
import {
  retryWithBackoff,
  logError,
} from '@/app/lib/retry-helper';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const caseId = formData.get('caseId') as string;

    // Validate required fields
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Optional: Verify case exists if caseId provided
    if (caseId) {
      const { data: caseData, error: caseError } = await supabase
        .from('petition_cases')
        .select('case_id')
        .eq('case_id', caseId)
        .single();

      if (caseError || !caseData) {
        return NextResponse.json(
          { error: 'Case not found' },
          { status: 404 }
        );
      }
    }

    const uploadedFiles = [];
    const failedFiles = [];

    console.log(`[Upload] Processing ${files.length} file(s)${caseId ? ` for case ${caseId}` : ''}`);

    for (const file of files) {
      try {
        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'image/jpeg',
          'image/png',
          'text/plain',
        ];

        if (!allowedTypes.includes(file.type)) {
          throw new Error(`File type ${file.type} not supported`);
        }

        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
          throw new Error(`File exceeds 50MB limit`);
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage with retry
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const storagePath = caseId
          ? `uploads/${caseId}/${fileName}`
          : `uploads/temp/${fileName}`;

        console.log(`[Upload] Uploading ${file.name} to ${storagePath}`);

        await retryWithBackoff(
          async () => {
            const { data, error } = await supabase.storage
              .from('petition-files')
              .upload(storagePath, buffer, {
                contentType: file.type,
                upsert: false,
              });

            if (error) {
              throw new Error(`Upload failed: ${error.message}`);
            }

            return data;
          },
          {
            maxRetries: 3,
            initialDelay: 1000,
          }
        );

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('petition-files')
          .getPublicUrl(storagePath);

        // Process file to extract text (for PDFs, DOCX)
        let extractedText = '';
        let pageCount = 0;

        if (
          file.type === 'application/pdf' ||
          file.type.includes('word') ||
          file.type.includes('document')
        ) {
          try {
            console.log(`[Upload] Processing text from ${file.name}`);
            const processedFile = await processFile(buffer, file.name);
            extractedText = processedFile.text;
            pageCount = processedFile.pageCount || 0;
            console.log(`[Upload] Extracted ${extractedText.split(/\s+/).length} words from ${file.name}`);
          } catch (error: any) {
            logError('processFile', error, { fileName: file.name });
            // Continue even if processing fails
          }
        }

        // Store file metadata in database if caseId provided
        if (caseId) {
          // Determine file type category
          let fileTypeCategory: string;
          if (file.type === 'application/pdf') {
            fileTypeCategory = 'pdf';
          } else if (file.type.includes('word') || file.type.includes('document')) {
            fileTypeCategory = 'docx';
          } else if (file.type.startsWith('image/')) {
            fileTypeCategory = 'image';
          } else {
            fileTypeCategory = 'txt';
          }

          try {
            await retryWithBackoff(
              async () => {
                const { error } = await supabase.from('case_files').insert({
                  case_id: caseId,
                  filename: file.name,
                  file_type: fileTypeCategory,
                  file_size_bytes: file.size,
                  mime_type: file.type,
                  storage_path: storagePath,
                  storage_url: urlData.publicUrl,
                  extracted_text: extractedText,
                  word_count: extractedText ? extractedText.split(/\s+/).length : 0,
                  uploaded_at: new Date().toISOString(),
                });

                if (error) {
                  throw new Error(`Database insert failed: ${error.message}`);
                }
              },
              {
                maxRetries: 3,
                initialDelay: 1000,
              }
            );

            console.log(`[Upload] Saved metadata for ${file.name} to database`);
          } catch (dbError) {
            logError('Database - save file metadata', dbError, { fileName: file.name, caseId });
            // Continue - file is uploaded even if metadata save fails
          }
        }

        uploadedFiles.push({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          storagePath,
          storageUrl: urlData.publicUrl,
          extractedText,
          pageCount,
        });

        console.log(`[Upload] Successfully processed ${file.name}`);
      } catch (fileError: any) {
        logError('Upload file', fileError, { fileName: file.name });
        failedFiles.push({
          fileName: file.name,
          error: fileError.message,
        });
        // Continue processing other files
      }
    }

    const message = failedFiles.length > 0
      ? `Uploaded ${uploadedFiles.length} file(s), ${failedFiles.length} failed`
      : `Successfully uploaded ${uploadedFiles.length} file(s)`;

    console.log(`[Upload] ${message}`);

    return NextResponse.json({
      success: true,
      message,
      files: uploadedFiles,
      failed: failedFiles.length > 0 ? failedFiles : undefined,
    });
  } catch (error: any) {
    logError('upload POST', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload files' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve uploaded files for a case
export async function GET(request: NextRequest) {
  const supabase = getSupabaseClient();

  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }

    console.log(`[Upload GET] Fetching files for case ${caseId}`);

    // Get files from database with retry
    const files = await retryWithBackoff(
      async () => {
        const { data, error } = await supabase
          .from('case_files')
          .select('*')
          .eq('case_id', caseId)
          .order('uploaded_at', { ascending: false });

        if (error) {
          throw new Error(`Failed to get files: ${error.message}`);
        }

        return data || [];
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
      }
    );

    console.log(`[Upload GET] Found ${files.length} file(s) for case ${caseId}`);

    return NextResponse.json({
      success: true,
      files,
    });
  } catch (error: any) {
    logError('upload GET', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get uploaded files' },
      { status: 500 }
    );
  }
}
