export interface Project {
  id: string;
  authorId: string;
  name: string;
  description: string;
  bannerImage?: string;
  thumbnailImage?: string;
  status: 'draft' | 'published';
  createdAt: Date | string;
  updatedAt: Date | string;
  publishedAt?: Date | string | null;
  websiteEmbed?: {
    url: string;
    enabled: boolean;
  };
  socialLinks: SocialLink[];
  sections: ProjectSection[];
  stats: {
    views: number;
    likes: number;
    comments: number;
  };
  tags: string[];
  author?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export interface ProjectSection {
  id: string;
  projectId: string;
  order: number;
  title: string;
  content: string;
  media: MediaItem[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface MediaItem {
  id?: string;
  type: 'image' | 'video-embed' | 'video-local';
  url: string;
  caption?: string;
  thumbnail?: string;
  platform?: 'youtube' | 'vimeo' | 'local';
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  sectionId?: string;
  userId: string;
  content: string;
  parentId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  user?: {
    id: string;
    name: string;
    image?: string;
  };
  replies?: ProjectComment[];
}

export interface ProjectLike {
  id: string;
  projectId: string;
  userId: string;
  createdAt: Date | string;
}

export interface ProjectSearchFilters {
  query?: string;
  tags?: string[];
  authorId?: string;
  status?: 'draft' | 'published';
  sortBy?: 'newest' | 'oldest' | 'most-viewed' | 'most-liked' | 'most-commented';
  page?: number;
  perPage?: number;
}

export interface ProjectListResult {
  projects: Project[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface CSVProjectRow {
  section_order: string;
  section_title: string;
  section_content: string;
  image_url_1?: string;
  image_url_2?: string;
  image_url_3?: string;
  video_url?: string;
  video_type?: 'youtube' | 'vimeo' | 'local';
}

export interface ProjectFormData {
  name: string;
  description: string;
  bannerImage?: File | string;
  thumbnailImage?: File | string;
  socialLinks: SocialLink[];
  sections: ProjectSection[];
  websiteEmbed?: {
    url: string;
    enabled: boolean;
  };
  tags: string[];
}

export interface UploadResponse {
  success: boolean;
  url?: string;
  thumbnail?: string;
  error?: string;
}
