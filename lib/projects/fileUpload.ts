import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const UPLOAD_DIR = '/var/www/studyhi/public/uploads/projects/';
const MAX_VIDEO_SIZE = 256 * 1024 * 1024; // 256MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// Allowed file types
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm'];

export const fileUpload = {
  /**
   * Initialize upload directory
   */
  initUploadDir(): void {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  },

  /**
   * Upload an image file
   */
  async uploadImage(file: Buffer, originalName: string): Promise<{ url: string; thumbnail?: string }> {
    this.initUploadDir();

    const ext = path.extname(originalName).toLowerCase();
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Validate file size
    if (file.length > MAX_IMAGE_SIZE) {
      throw new Error(`Image size exceeds maximum of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
    }

    // Process and save image
    await sharp(file)
      .resize(1920, 1080, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toFile(filePath);

    // Create thumbnail
    const thumbnailName = `${uuidv4()}_thumb${ext}`;
    const thumbnailPath = path.join(UPLOAD_DIR, thumbnailName);

    await sharp(file)
      .resize(300, 225, {
        fit: 'cover',
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    return {
      url: `/uploads/projects/${fileName}`,
      thumbnail: `/uploads/projects/${thumbnailName}`,
    };
  },

  /**
   * Upload a video file
   */
  async uploadVideo(file: Buffer, originalName: string): Promise<{ url: string; thumbnail?: string }> {
    this.initUploadDir();

    const ext = path.extname(originalName).toLowerCase();
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Validate file size
    if (file.length > MAX_VIDEO_SIZE) {
      throw new Error(`Video size exceeds maximum of ${MAX_VIDEO_SIZE / 1024 / 1024}MB`);
    }

    // Save video file
    await fs.promises.writeFile(filePath, file);

    // Generate thumbnail (placeholder - would need ffmpeg in production)
    const thumbnail = await this.generateVideoThumbnail(filePath);

    return {
      url: `/uploads/projects/${fileName}`,
      thumbnail,
    };
  },

  /**
   * Generate video thumbnail
   * Note: This is a placeholder. In production, use ffmpeg or similar
   */
  async generateVideoThumbnail(videoPath: string): Promise<string> {
    // For now, return a placeholder
    // In production, use ffmpeg to extract a frame:
    // ffmpeg -i video.mp4 -ss 00:00:01 -vframes 1 thumbnail.jpg
    
    const thumbnailName = `${uuidv4()}_video_thumb.jpg`;
    const thumbnailPath = path.join(UPLOAD_DIR, thumbnailName);

    // Create a simple placeholder image
    await sharp({
      create: {
        width: 640,
        height: 360,
        channels: 4,
        background: { r: 59, g: 130, b: 246, alpha: 1 },
      },
    })
      .jpeg()
      .toFile(thumbnailPath);

    return `/uploads/projects/${thumbnailName}`;
  },

  /**
   * Delete a file
   */
  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  },

  /**
   * Validate file type
   */
  validateFileType(mimeType: string): { valid: boolean; type: 'image' | 'video' | null } {
    if (IMAGE_TYPES.includes(mimeType)) {
      return { valid: true, type: 'image' };
    }
    if (VIDEO_TYPES.includes(mimeType)) {
      return { valid: true, type: 'video' };
    }
    return { valid: false, type: null };
  },

  /**
   * Get file info
   */
  getFileInfo(file: Buffer, originalName: string) {
    const ext = path.extname(originalName).toLowerCase();
    const size = file.length;
    
    return {
      originalName,
      extension: ext,
      size,
      sizeReadable: this.formatFileSize(size),
    };
  },

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },
};
