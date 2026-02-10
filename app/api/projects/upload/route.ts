import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { fileUpload } from '@/lib/projects/fileUpload';

/**
 * POST /api/projects/upload
 * Handle media uploads (images/videos)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate file type
    const validation = fileUpload.validateFileType(file.type);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: images (jpg, png, gif, webp) and videos (mp4, webm)' },
        { status: 400 }
      );
    }

    let result;

    if (validation.type === 'image') {
      result = await fileUpload.uploadImage(buffer, file.name);
    } else if (validation.type === 'video') {
      result = await fileUpload.uploadVideo(buffer, file.name);
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
