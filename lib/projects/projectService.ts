import { dbService } from '@/lib/database/database-service';
import { Project, ProjectSearchFilters, ProjectListResult, ProjectSection } from '@/types/projects';

const prisma = dbService.getPrisma();

export const projectService = {
  /**
   * Create a new project
   */
  async createProject(data: {
    authorId: string;
    name: string;
    description: string;
    tags?: string[];
    status?: 'draft' | 'published';
  }): Promise<Project> {
    const project = await prisma.project.create({
      data: {
        authorId: data.authorId,
        name: data.name,
        description: data.description,
        tags: JSON.stringify(data.tags || []),
        status: data.status || 'draft',
        publishedAt: data.status === 'published' ? new Date() : null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return this.mapProjectFromDb(project);
  },

  /**
   * Get a project by ID
   */
  async getProject(id: string, trackView: boolean = false): Promise<Project | null> {
    if (trackView) {
      await this.incrementView(id);
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!project) return null;

    return this.mapProjectFromDb(project);
  },

  /**
   * Update a project
   */
  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const updateData: any = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.description) updateData.description = updates.description;
    if (updates.bannerImage !== undefined) updateData.bannerImage = updates.bannerImage;
    if (updates.thumbnailImage !== undefined) updateData.thumbnailImage = updates.thumbnailImage;
    if (updates.tags) updateData.tags = JSON.stringify(updates.tags);
    if (updates.socialLinks) updateData.socialLinks = JSON.stringify(updates.socialLinks);
    if (updates.websiteEmbed) {
      updateData.websiteUrl = updates.websiteEmbed.url;
      updateData.websiteEnabled = updates.websiteEmbed.enabled;
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return this.mapProjectFromDb(project);
  },

  /**
   * Delete a project and its media
   */
  async deleteProject(id: string): Promise<void> {
    await prisma.project.delete({
      where: { id },
    });
  },

  /**
   * Publish a project
   */
  async publishProject(id: string): Promise<Project> {
    const project = await prisma.project.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return this.mapProjectFromDb(project);
  },

  /**
   * Search projects with filters
   */
  async searchProjects(filters: ProjectSearchFilters): Promise<ProjectListResult> {
    const {
      query,
      tags,
      authorId,
      status,
      sortBy = 'newest',
      page = 1,
      perPage = 12,
    } = filters;

    const where: any = {};

    // Filter by status (default to published only)
    if (status) {
      where.status = status;
    } else {
      where.status = 'published';
    }

    // Filter by author
    if (authorId) {
      where.authorId = authorId;
    }

    // Build OR conditions for tags and query
    const orConditions = [];
    
    // Filter by tags
    if (tags && tags.length > 0) {
      orConditions.push(...tags.map((tag) => ({
        tags: {
          contains: tag,
        },
      })));
    }

    // Full-text search
    if (query) {
      orConditions.push(
        { name: { contains: query } },
        { description: { contains: query } }
      );
    }

    // Add OR conditions to where clause if any exist
    if (orConditions.length > 0) {
      where.OR = orConditions;
    }

    // Sorting
    let orderBy: any = {};
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'most-viewed':
        orderBy = { views: 'desc' };
        break;
      case 'most-liked':
        orderBy = { likes: 'desc' };
        break;
      case 'most-commented':
        orderBy = { commentsCount: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { publishedAt: 'desc' };
        break;
    }

    // Count total
    const total = await prisma.project.count({ where });

    // Get projects
    const projects = await prisma.project.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        sections: {
          orderBy: { order: 'asc' },
          take: 1, // Only first section for preview
        },
      },
    });

    return {
      projects: projects.map(this.mapProjectFromDb),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  },

  /**
   * Toggle like on a project
   */
  async likeProject(projectId: string, userId: string): Promise<{ liked: boolean }> {
    const existingLike = await prisma.projectLike.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.projectLike.delete({
        where: { id: existingLike.id },
      });
      await prisma.project.update({
        where: { id: projectId },
        data: { likes: { decrement: 1 } },
      });
      return { liked: false };
    } else {
      // Like
      await prisma.projectLike.create({
        data: {
          projectId,
          userId,
        },
      });
      await prisma.project.update({
        where: { id: projectId },
        data: { likes: { increment: 1 } },
      });
      return { liked: true };
    }
  },

  /**
   * Increment view count
   */
  async incrementView(projectId: string): Promise<void> {
    await prisma.project.update({
      where: { id: projectId },
      data: { views: { increment: 1 } },
    });
  },

  /**
   * Add comment to a project or section
   */
  async addComment(data: {
    projectId: string;
    sectionId?: string;
    userId: string;
    content: string;
    parentId?: string;
  }): Promise<any> {
    const comment = await prisma.projectComment.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Increment comment count
    await prisma.project.update({
      where: { id: data.projectId },
      data: { commentsCount: { increment: 1 } },
    });

    return comment;
  },

  /**
   * Get comments for a project or section
   */
  async getComments(projectId: string, sectionId?: string): Promise<any[]> {
    const where: any = { projectId, parentId: null };
    if (sectionId) {
      where.sectionId = sectionId;
    }

    const comments = await prisma.projectComment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return comments;
  },

  /**
   * Update a comment
   */
  async updateComment(commentId: string, content: string): Promise<any> {
    return await prisma.projectComment.update({
      where: { id: commentId },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    const comment = await prisma.projectComment.findUnique({
      where: { id: commentId },
    });

    if (comment) {
      await prisma.projectComment.delete({
        where: { id: commentId },
      });

      // Decrement comment count
      await prisma.project.update({
        where: { id: comment.projectId },
        data: { commentsCount: { decrement: 1 } },
      });
    }
  },

  /**
   * Create or update project sections
   */
  async updateSections(projectId: string, sections: ProjectSection[]): Promise<void> {
    // Delete existing sections
    await prisma.projectSection.deleteMany({
      where: { projectId },
    });

    // Create new sections
    for (const section of sections) {
      await prisma.projectSection.create({
        data: {
          projectId,
          order: section.order,
          title: section.title,
          content: section.content,
          media: JSON.stringify(section.media || []),
        },
      });
    }
  },

  /**
   * Map database project to API project
   */
  mapProjectFromDb(project: any): Project {
    return {
      id: project.id,
      authorId: project.authorId,
      name: project.name,
      description: project.description,
      bannerImage: project.bannerImage,
      thumbnailImage: project.thumbnailImage,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      publishedAt: project.publishedAt,
      websiteEmbed: project.websiteUrl
        ? {
            url: project.websiteUrl,
            enabled: project.websiteEnabled,
          }
        : undefined,
      socialLinks: JSON.parse(project.socialLinks),
      sections: project.sections
        ? project.sections.map((s: any) => ({
            id: s.id,
            projectId: s.projectId,
            order: s.order,
            title: s.title,
            content: s.content,
            media: JSON.parse(s.media),
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
          }))
        : [],
      stats: {
        views: project.views,
        likes: project.likes,
        comments: project.commentsCount,
      },
      tags: JSON.parse(project.tags),
      author: project.author,
    };
  },
};
