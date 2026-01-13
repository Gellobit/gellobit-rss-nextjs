import { createAdminClient } from '@/lib/utils/supabase-admin';

const BUCKET_NAME = 'images';

interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  mediaId?: string;
}

interface MediaFile {
  id: string;
  file_name: string;
  file_path: string;
  file_url: string;
  entity_type: 'opportunity' | 'feed' | 'setting';
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
      entityType: 'opportunity' | 'feed' | 'setting';
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
      entityType: 'opportunity' | 'feed' | 'setting';
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
    entityType: 'opportunity' | 'feed' | 'setting',
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
}

export const imageService = new ImageService();
