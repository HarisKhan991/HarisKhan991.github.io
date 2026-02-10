import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { projectService } from '@/lib/projects/projectService';

/**
 * POST /api/projects/[projectId]/like
 * Like or unlike a project
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

    // Check if project exists
    const project = await projectService.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const result = await projectService.likeProject(projectId, userId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error liking project:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to like project' },
      { status: 500 }
    );
  }
}
