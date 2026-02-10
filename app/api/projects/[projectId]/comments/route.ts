import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { projectService } from '@/lib/projects/projectService';
import { projectValidation } from '@/lib/projects/projectValidation';

/**
 * GET /api/projects/[projectId]/comments
 * Get comments for a project or section
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const sectionId = request.nextUrl.searchParams.get('sectionId') || undefined;

    const comments = await projectService.getComments(projectId, sectionId);

    return NextResponse.json(comments);
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[projectId]/comments
 * Add a comment to a project or section
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const userId = (session.user as any).id;
    const body = await request.json();

    // Validate content
    if (!body.content || body.content.trim().length < 1) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    // Sanitize content
    const sanitizedContent = projectValidation.sanitizeContent(body.content);

    const comment = await projectService.addComment({
      projectId,
      sectionId: body.sectionId,
      userId,
      content: sanitizedContent,
      parentId: body.parentId,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add comment' },
      { status: 500 }
    );
  }
}
