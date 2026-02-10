import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { projectService } from '@/lib/projects/projectService';
import { projectValidation } from '@/lib/projects/projectValidation';
import { dbService } from '@/lib/database/database-service';

const prisma = dbService.getPrisma();

/**
 * PUT /api/projects/[projectId]/comments/[commentId]
 * Update a comment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId } = await params;
    const userId = (session.user as any).id;
    const body = await request.json();

    // Check if user owns this comment
    const existingComment = await prisma.projectComment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (existingComment.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Validate content
    if (!body.content || body.content.trim().length < 1) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    // Sanitize content
    const sanitizedContent = projectValidation.sanitizeContent(body.content);

    const updated = await projectService.updateComment(commentId, sanitizedContent);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update comment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[projectId]/comments/[commentId]
 * Delete a comment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId } = await params;
    const userId = (session.user as any).id;

    // Check if user owns this comment
    const existingComment = await prisma.projectComment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (existingComment.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await projectService.deleteComment(commentId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
