import * as yup from 'yup';
import { Project, ProjectSection, SocialLink, MediaItem } from '@/types/projects';

// Constants for validation
const MAX_VIDEO_SIZE = 256 * 1024 * 1024; // 256MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// Social link validation schema
const socialLinkSchema = yup.object().shape({
  platform: yup.string().required('Platform is required'),
  url: yup.string().url('Must be a valid URL').required('URL is required'),
  icon: yup.string().required('Icon is required'),
});

// Media item validation schema
const mediaItemSchema = yup.object().shape({
  type: yup
    .string()
    .oneOf(['image', 'video-embed', 'video-local'], 'Invalid media type')
    .required('Media type is required'),
  url: yup.string().required('URL is required'),
  caption: yup.string().optional(),
  thumbnail: yup.string().optional(),
  platform: yup.string().oneOf(['youtube', 'vimeo', 'local']).optional(),
});

// Section validation schema
const sectionSchema = yup.object().shape({
  order: yup.number().min(0, 'Order must be positive').required('Order is required'),
  title: yup
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
    .required('Title is required'),
  content: yup
    .string()
    .min(10, 'Content must be at least 10 characters')
    .required('Content is required'),
  media: yup.array().of(mediaItemSchema).optional(),
});

// Project validation schema
const projectSchema = yup.object().shape({
  name: yup
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must be less than 100 characters')
    .required('Project name is required'),
  description: yup
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters')
    .required('Description is required'),
  bannerImage: yup.string().optional(),
  thumbnailImage: yup.string().optional(),
  socialLinks: yup.array().of(socialLinkSchema).optional(),
  sections: yup
    .array()
    .of(sectionSchema)
    .min(1, 'At least one section is required')
    .required('Sections are required'),
  websiteEmbed: yup
    .object()
    .shape({
      url: yup.string().url('Must be a valid URL').optional(),
      enabled: yup.boolean().optional(),
    })
    .optional(),
  tags: yup
    .array()
    .of(yup.string())
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
});

export const projectValidation = {
  /**
   * Validate project data
   */
  async validateProject(data: Partial<Project>): Promise<{ valid: boolean; errors?: any }> {
    try {
      await projectSchema.validate(data, { abortEarly: false });
      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        errors: error.inner.reduce((acc: any, err: any) => {
          acc[err.path] = err.message;
          return acc;
        }, {}),
      };
    }
  },

  /**
   * Validate a single section
   */
  async validateSection(section: Partial<ProjectSection>): Promise<{ valid: boolean; errors?: any }> {
    try {
      await sectionSchema.validate(section, { abortEarly: false });
      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        errors: error.inner.reduce((acc: any, err: any) => {
          acc[err.path] = err.message;
          return acc;
        }, {}),
      };
    }
  },

  /**
   * Validate social link
   */
  async validateSocialLink(link: SocialLink): Promise<{ valid: boolean; errors?: any }> {
    try {
      await socialLinkSchema.validate(link, { abortEarly: false });
      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        errors: error.inner.reduce((acc: any, err: any) => {
          acc[err.path] = err.message;
          return acc;
        }, {}),
      };
    }
  },

  /**
   * Validate media URL based on type
   */
  validateMediaUrl(url: string, type: 'image' | 'video-embed' | 'video-local'): boolean {
    if (!url) return false;

    try {
      new URL(url);

      switch (type) {
        case 'image':
          // Check if URL has image extension
          return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
        case 'video-embed':
          // Check if URL is from YouTube or Vimeo
          return /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
        case 'video-local':
          // Local video should have video extension
          return /\.(mp4|webm|mov)$/i.test(url);
        default:
          return false;
      }
    } catch {
      return false;
    }
  },

  /**
   * Validate file size (in bytes)
   */
  validateFileSize(size: number, maxSize: number = MAX_VIDEO_SIZE): boolean {
    return size > 0 && size <= maxSize;
  },

  /**
   * Validate file type
   */
  validateFileType(
    mimeType: string,
    allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
  ): boolean {
    return allowedTypes.includes(mimeType);
  },

  /**
   * Sanitize content to prevent XSS
   * NOTE: This is basic sanitization. For production, consider using 
   * a dedicated library like DOMPurify or isomorphic-dompurify
   */
  sanitizeContent(content: string): string {
    // Basic XSS prevention - strip script tags and dangerous attributes
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '');
  },
};
