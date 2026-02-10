import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { projectService } from '@/lib/projects/projectService';

/**
 * POST /api/projects/[projectId]/view
 * Increment view count
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

    // Check if project exists
    const project = await projectService.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await projectService.incrementView(projectId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error incrementing view:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to increment view' },
      { status: 500 }
    );
  }
}
