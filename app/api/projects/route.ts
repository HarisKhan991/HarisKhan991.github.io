import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { projectService } from '@/lib/projects/projectService';
import { projectValidation } from '@/lib/projects/projectValidation';

/**
 * GET /api/projects
 * List projects with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    
    const filters = {
      query: searchParams.get('query') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      authorId: searchParams.get('authorId') || undefined,
      status: searchParams.get('status') as 'draft' | 'published' | undefined,
      sortBy: (searchParams.get('sortBy') || 'newest') as any,
      page: parseInt(searchParams.get('page') || '1'),
      perPage: parseInt(searchParams.get('perPage') || '12'),
    };

    const result = await projectService.searchProjects(filters);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate project data
    const validation = await projectValidation.validateProject(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Get user ID from session
    const userId = (session.user as any).id;

    // Create project
    const project = await projectService.createProject({
      authorId: userId,
      name: body.name,
      description: body.description,
      tags: body.tags || [],
      status: body.status || 'draft',
    });

    // Update sections if provided
    if (body.sections && body.sections.length > 0) {
      await projectService.updateSections(project.id, body.sections);
    }

    // Update other fields if provided
    if (body.bannerImage || body.thumbnailImage || body.socialLinks || body.websiteEmbed) {
      const updated = await projectService.updateProject(project.id, {
        bannerImage: body.bannerImage,
        thumbnailImage: body.thumbnailImage,
        socialLinks: body.socialLinks,
        websiteEmbed: body.websiteEmbed,
        tags: body.tags,
      });
      return NextResponse.json(updated, { status: 201 });
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}
