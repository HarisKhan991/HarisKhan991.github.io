import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { projectService } from '@/lib/projects/projectService';

/**
 * POST /api/projects/[projectId]/publish
 * Publish a draft project
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

    // Check if user owns this project
    const existingProject = await projectService.getProject(projectId);
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (existingProject.authorId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (existingProject.status === 'published') {
      return NextResponse.json({ error: 'Project already published' }, { status: 400 });
    }

    const published = await projectService.publishProject(projectId);

    return NextResponse.json(published);
  } catch (error: any) {
    console.error('Error publishing project:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish project' },
      { status: 500 }
    );
  }
}
