import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processFile } from '@/app/lib/file-processor';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
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

    for (const file of files) {
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
        return NextResponse.json(
          { error: `File type ${file.type} not supported for file ${file.name}` },
          { status: 400 }
        );
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 50MB limit` },
          { status: 400 }
        );
      }

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase Storage
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storagePath = caseId
        ? `uploads/${caseId}/${fileName}`
        : `uploads/temp/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('petition-files')
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }

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
          const processedFile = await processFile(buffer, file.name);
          extractedText = processedFile.text;
          pageCount = processedFile.pageCount || 0;
        } catch (error: any) {
          console.warn(`Failed to process ${file.name}:`, error.message);
          // Continue even if processing fails
        }
      }

      // Store file metadata in database if caseId provided
      if (caseId) {
        await supabase.from('case_files').insert({
          case_id: caseId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: storagePath,
          storage_url: urlData.publicUrl,
          extracted_text: extractedText,
          page_count: pageCount,
          uploaded_at: new Date().toISOString(),
        });
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
    }

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      files: uploadedFiles,
    });
  } catch (error: any) {
    console.error('Error in upload:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload files' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve uploaded files for a case
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }

    // Get files from database
    const { data: files, error: filesError } = await supabase
      .from('case_files')
      .select('*')
      .eq('case_id', caseId)
      .order('uploaded_at', { ascending: false });

    if (filesError) {
      throw new Error(`Failed to get files: ${filesError.message}`);
    }

    return NextResponse.json({
      success: true,
      files: files || [],
    });
  } catch (error: any) {
    console.error('Error in get uploaded files:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get uploaded files' },
      { status: 500 }
    );
  }
}
