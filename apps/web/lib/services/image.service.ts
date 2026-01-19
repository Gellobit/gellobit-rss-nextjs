import { createAdminClient } from '@/lib/utils/supabase-admin';

const BUCKET_NAME = 'images';

interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  mediaId?: string;
}

type EntityType = 'opportunity' | 'feed' | 'setting' | 'post';

interface MediaFile {
  id: string;
  file_name: string;
  file_path: string;
  file_url: string;
  entity_type: EntityType;
  entity_id: string | null;
}

export class ImageService {
  private supabase = createAdminClient();

  /**
   * Upload an image to Supabase Storage
   */
  async uploadImage(
    file: File | Buffer,
    options: {
      fileName?: string;
      folder?: string;
      entityType: EntityType;
      entityId?: string;
      isBase64?: boolean;
    }
  ): Promise<UploadResult> {
    try {
      const { folder = 'general', entityType, entityId } = options;

      // Generate unique file name
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      let extension = 'jpg';
      let originalName = 'uploaded-image';

      if (file instanceof File) {
        extension = file.name.split('.').pop() || 'jpg';
        originalName = file.name;
      }

      const fileName = options.fileName || `${timestamp}-${random}.${extension}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await this.supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file instanceof File ? file.type : 'image/jpeg'
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Track in database
      const { data: mediaRecord, error: dbError } = await this.supabase
        .from('media_files')
        .insert({
          file_name: fileName,
          original_name: originalName,
          file_path: filePath,
          file_url: publicUrl,
          file_size: file instanceof File ? file.size : (file as Buffer).length,
          mime_type: file instanceof File ? file.type : 'image/jpeg',
          bucket: BUCKET_NAME,
          entity_type: entityType,
          entity_id: entityId || null
        })
        .select('id')
        .single();

      if (dbError) {
        console.error('Error tracking media file:', dbError);
        // Don't fail the upload, just log the error
      }

      return {
        success: true,
        url: publicUrl,
        path: filePath,
        mediaId: mediaRecord?.id
      };
    } catch (error) {
      console.error('Image upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload image from URL (for scraped images)
   */
  async uploadFromUrl(
    imageUrl: string,
    options: {
      folder?: string;
      entityType: EntityType;
      entityId?: string;
    }
  ): Promise<UploadResult> {
    try {
      // Fetch the image
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GellobotBot/1.0)'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const buffer = Buffer.from(await response.arrayBuffer());

      // Determine extension from content type
      const extensionMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/svg+xml': 'svg'
      };

      const extension = extensionMap[contentType] || 'jpg';
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const fileName = `${timestamp}-${random}.${extension}`;

      return this.uploadImage(buffer, {
        fileName,
        folder: options.folder || 'scraped',
        entityType: options.entityType,
        entityId: options.entityId
      });
    } catch (error) {
      console.error('Error uploading from URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete an image by path
   */
  async deleteImage(filePath: string): Promise<boolean> {
    try {
      // Delete from storage
      const { error: storageError } = await this.supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
      }

      // Delete from tracking table
      await this.supabase
        .from('media_files')
        .delete()
        .eq('file_path', filePath);

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  /**
   * Delete all images associated with an entity
   */
  async deleteEntityImages(entityType: string, entityId: string): Promise<number> {
    try {
      // Get all media files for this entity
      const { data: files, error } = await this.supabase
        .from('media_files')
        .select('file_path')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (error || !files || files.length === 0) {
        return 0;
      }

      const paths = files.map(f => f.file_path);

      // Delete from storage
      await this.supabase.storage
        .from(BUCKET_NAME)
        .remove(paths);

      // Delete from tracking (this happens automatically via trigger for opportunities)
      const { count } = await this.supabase
        .from('media_files')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .select('*', { count: 'exact', head: true });

      return count || paths.length;
    } catch (error) {
      console.error('Error deleting entity images:', error);
      return 0;
    }
  }

  /**
   * Clean up orphaned images (images not linked to any entity)
   */
  async cleanupOrphanedImages(): Promise<number> {
    try {
      // Find orphaned opportunity images
      const { data: orphanedOpportunityImages } = await this.supabase
        .from('media_files')
        .select('id, file_path')
        .eq('entity_type', 'opportunity')
        .not('entity_id', 'is', null)
        .filter('entity_id', 'not.in', `(SELECT id FROM opportunities)`);

      // Find orphaned feed images
      const { data: orphanedFeedImages } = await this.supabase
        .from('media_files')
        .select('id, file_path')
        .eq('entity_type', 'feed')
        .not('entity_id', 'is', null)
        .filter('entity_id', 'not.in', `(SELECT id FROM rss_feeds)`);

      const allOrphaned = [
        ...(orphanedOpportunityImages || []),
        ...(orphanedFeedImages || [])
      ];

      if (allOrphaned.length === 0) {
        return 0;
      }

      // Delete from storage
      const paths = allOrphaned.map(f => f.file_path);
      await this.supabase.storage
        .from(BUCKET_NAME)
        .remove(paths);

      // Delete from tracking
      const ids = allOrphaned.map(f => f.id);
      await this.supabase
        .from('media_files')
        .delete()
        .in('id', ids);

      return allOrphaned.length;
    } catch (error) {
      console.error('Error cleaning up orphaned images:', error);
      return 0;
    }
  }

  /**
   * Update entity reference for an image
   */
  async linkImageToEntity(
    mediaId: string,
    entityType: EntityType,
    entityId: string
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('media_files')
        .update({ entity_type: entityType, entity_id: entityId })
        .eq('id', mediaId);

      return !error;
    } catch (error) {
      console.error('Error linking image to entity:', error);
      return false;
    }
  }

  /**
   * Check if a URL is a valid image URL
   */
  private isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    // Must be http or https
    if (!url.startsWith('http://') && !url.startsWith('https://')) return false;

    // Check for common image extensions or image-related paths
    const imagePatterns = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;
    const imagePathPatterns = /(\/image\/|\/images\/|\/img\/|\/media\/|\/uploads\/|\/wp-content\/)/i;

    return imagePatterns.test(url) || imagePathPatterns.test(url);
  }

  /**
   * Check if URL should be skipped (tracking pixels, icons, etc.)
   */
  private shouldSkipImage(url: string): boolean {
    const skipPatterns = [
      /avatar/i,
      /icon/i,
      /logo/i,
      /button/i,
      /sprite/i,
      /badge/i,
      /pixel/i,
      /tracking/i,
      /beacon/i,
      /1x1/i,
      /spacer/i,
      /blank\./i,
      /gravatar/i,
      /emoji/i,
      /\.gif$/i, // Often tracking pixels
    ];

    return skipPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Process HTML content and upload all images to storage
   * Returns the modified HTML with local image URLs
   */
  async processContentImages(
    htmlContent: string,
    options: {
      entityType: EntityType;
      entityId?: string;
      folder?: string;
      baseUrl?: string;
    }
  ): Promise<{ content: string; uploadedCount: number; failedCount: number }> {
    const { entityType, entityId, folder = 'posts/content', baseUrl } = options;

    let uploadedCount = 0;
    let failedCount = 0;
    let processedContent = htmlContent;

    // Find all image tags with src attributes
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const matches: Array<{ fullMatch: string; src: string }> = [];

    let match;
    while ((match = imgRegex.exec(htmlContent)) !== null) {
      matches.push({
        fullMatch: match[0],
        src: match[1]
      });
    }

    // Also check for data-src (lazy loaded images)
    const dataSrcRegex = /<img[^>]+data-src=["']([^"']+)["'][^>]*>/gi;
    while ((match = dataSrcRegex.exec(htmlContent)) !== null) {
      // Only add if not already matched by src
      if (!matches.some(m => m.src === match[1])) {
        matches.push({
          fullMatch: match[0],
          src: match[1]
        });
      }
    }

    // Process each image
    for (const img of matches) {
      let imageUrl = img.src;

      // Resolve relative URLs
      if (baseUrl && !imageUrl.startsWith('http')) {
        try {
          imageUrl = new URL(imageUrl, baseUrl).href;
        } catch {
          console.warn('Failed to resolve image URL:', imageUrl);
          failedCount++;
          continue;
        }
      }

      // Skip invalid or unwanted images
      if (!this.isValidImageUrl(imageUrl) || this.shouldSkipImage(imageUrl)) {
        continue;
      }

      // Upload the image
      const result = await this.uploadFromUrl(imageUrl, {
        folder,
        entityType,
        entityId
      });

      if (result.success && result.url) {
        // Replace the original URL with the new one
        processedContent = processedContent.replace(img.src, result.url);
        uploadedCount++;
      } else {
        console.warn('Failed to upload image:', imageUrl, result.error);
        failedCount++;
      }
    }

    return {
      content: processedContent,
      uploadedCount,
      failedCount
    };
  }

  /**
   * Process featured image for a blog post
   * Downloads and stores the image, returns the new URL
   */
  async processFeaturedImage(
    imageUrl: string | null | undefined,
    options: {
      entityType: EntityType;
      entityId?: string;
      fallbackUrl?: string | null;
    }
  ): Promise<string | null> {
    const { entityType, entityId, fallbackUrl } = options;

    // If no image URL provided, use fallback
    if (!imageUrl) {
      return fallbackUrl || null;
    }

    // Skip if it's not a valid image URL
    if (!this.isValidImageUrl(imageUrl)) {
      console.warn('Invalid featured image URL:', imageUrl);
      return fallbackUrl || null;
    }

    // Skip tracking pixels and icons
    if (this.shouldSkipImage(imageUrl)) {
      console.warn('Skipping unwanted image type:', imageUrl);
      return fallbackUrl || null;
    }

    // Upload the image
    const result = await this.uploadFromUrl(imageUrl, {
      folder: 'posts/featured',
      entityType,
      entityId
    });

    if (result.success && result.url) {
      return result.url;
    }

    console.warn('Failed to upload featured image:', imageUrl, result.error);
    return fallbackUrl || null;
  }

  /**
   * Process all images for a blog post (featured + content)
   */
  async processPostImages(
    featuredImageUrl: string | null | undefined,
    htmlContent: string,
    options: {
      postId?: string;
      fallbackFeaturedUrl?: string | null;
      baseUrl?: string;
    }
  ): Promise<{
    featuredImageUrl: string | null;
    content: string;
    stats: {
      featuredUploaded: boolean;
      contentImagesUploaded: number;
      contentImagesFailed: number;
    };
  }> {
    const { postId, fallbackFeaturedUrl, baseUrl } = options;

    // Process featured image
    const processedFeaturedUrl = await this.processFeaturedImage(featuredImageUrl, {
      entityType: 'post',
      entityId: postId,
      fallbackUrl: fallbackFeaturedUrl
    });

    // Process content images
    const contentResult = await this.processContentImages(htmlContent, {
      entityType: 'post',
      entityId: postId,
      folder: 'posts/content',
      baseUrl
    });

    return {
      featuredImageUrl: processedFeaturedUrl,
      content: contentResult.content,
      stats: {
        featuredUploaded: processedFeaturedUrl !== fallbackFeaturedUrl && processedFeaturedUrl !== null,
        contentImagesUploaded: contentResult.uploadedCount,
        contentImagesFailed: contentResult.failedCount
      }
    };
  }
}

export const imageService = new ImageService();
