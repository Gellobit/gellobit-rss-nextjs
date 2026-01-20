import { createAdminClient } from '../utils/supabase-admin';
import { logger } from '../utils/logger';
import type { AIGeneratedContent } from '../types/ai.types';

/**
 * Post status type
 */
export type PostStatus = 'draft' | 'published' | 'archived';

/**
 * Create post data interface
 */
export interface CreatePostData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  source_url?: string;
  source_feed_id?: string;
  featured_image_url?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  category_id?: string | null;
  status?: PostStatus;
}

/**
 * Post Service - CRUD operations for blog posts
 * Used by RSS processor to create blog posts from AI-generated content
 */
export class PostService {
  private static instance: PostService;

  private constructor() {}

  static getInstance(): PostService {
    if (!PostService.instance) {
      PostService.instance = new PostService();
    }
    return PostService.instance;
  }

  /**
   * Create a new blog post from AI-generated content
   *
   * @param aiContent - AI-generated content
   * @param sourceUrl - Source URL
   * @param sourceFeedId - Source feed ID
   * @param autoPublish - Auto-publish based on feed settings
   * @param featuredImageUrl - Featured image URL (from scraper or fallback)
   * @param categoryId - Category ID (from feed settings or default)
   * @param options - Additional options for preserving source data
   * @returns Created post ID or null
   */
  async createFromAI(
    aiContent: AIGeneratedContent,
    sourceUrl: string,
    sourceFeedId: string,
    autoPublish: boolean = false,
    featuredImageUrl?: string | null,
    categoryId?: string | null,
    options?: {
      preserveSourceSlug?: boolean;
      preserveSourceTitle?: boolean;
      originalTitle?: string;
    }
  ): Promise<string | null> {
    if (!aiContent.valid || !aiContent.title || !aiContent.content) {
      await logger.warning('Cannot create post from invalid AI content', {
        source_url: sourceUrl,
        feed_id: sourceFeedId,
      });
      return null;
    }

    try {
      // Determine the title to use
      const title = options?.preserveSourceTitle && options.originalTitle
        ? options.originalTitle
        : aiContent.title;

      // Determine the slug to use
      let slug: string;
      if (options?.preserveSourceSlug) {
        // Extract slug from source URL
        slug = this.extractSlugFromUrl(sourceUrl);
        // Check if slug already exists, add suffix if needed
        if (await this.slugExists(slug)) {
          const timestamp = Date.now().toString(36);
          slug = `${slug}-${timestamp}`;
        }
      } else {
        slug = this.generateSlug(title);
      }

      // Get default category if no category specified
      let finalCategoryId = categoryId;
      if (!finalCategoryId) {
        finalCategoryId = await this.getDefaultCategoryId();
      }

      const postData: CreatePostData = {
        title,
        slug,
        excerpt: aiContent.excerpt || this.generateExcerpt(aiContent.content),
        content: aiContent.content,
        source_url: sourceUrl,
        source_feed_id: sourceFeedId,
        featured_image_url: featuredImageUrl || null,
        meta_title: aiContent.meta_title || title,
        meta_description: aiContent.meta_description || aiContent.excerpt,
        category_id: finalCategoryId,
        status: autoPublish ? 'published' : 'draft',
      };

      return await this.create(postData);
    } catch (error) {
      await logger.error('Error creating post from AI', {
        source_url: sourceUrl,
        feed_id: sourceFeedId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Extract slug from URL
   * e.g., https://example.com/my-post-title -> my-post-title
   *
   * @param url - Source URL
   * @returns Extracted slug
   */
  private extractSlugFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Get the pathname and remove leading/trailing slashes
      let pathname = urlObj.pathname.replace(/^\/+|\/+$/g, '');

      // If pathname is empty, use a default
      if (!pathname) {
        return `post-${Date.now().toString(36)}`;
      }

      // Get the last segment of the path (in case of nested paths)
      const segments = pathname.split('/');
      let slug = segments[segments.length - 1];

      // Remove file extensions if present
      slug = slug.replace(/\.(html?|php|aspx?)$/i, '');

      // Clean up the slug
      slug = slug
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 100);

      return slug || `post-${Date.now().toString(36)}`;
    } catch {
      // If URL parsing fails, generate a default slug
      return `post-${Date.now().toString(36)}`;
    }
  }

  /**
   * Get the default category ID
   *
   * @returns Default category ID or null
   */
  private async getDefaultCategoryId(): Promise<string | null> {
    try {
      const supabase = createAdminClient();

      const { data } = await supabase
        .from('categories')
        .select('id')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      return data?.id || null;
    } catch {
      return null;
    }
  }

  /**
   * Create a new blog post
   *
   * @param data - Post data
   * @returns Created post ID or null
   */
  async create(data: CreatePostData): Promise<string | null> {
    try {
      const supabase = createAdminClient();

      const postData: any = {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        content: data.content,
        featured_image_url: data.featured_image_url || null,
        meta_title: data.meta_title || null,
        meta_description: data.meta_description || null,
        category_id: data.category_id || null,
        status: data.status || 'draft',
        source_url: data.source_url || null,
        source_feed_id: data.source_feed_id || null,
      };

      // Set published_at if publishing
      if (data.status === 'published') {
        postData.published_at = new Date().toISOString();
      }

      const { data: post, error } = await supabase
        .from('posts')
        .insert(postData)
        .select('id')
        .single();

      if (error) throw error;

      await logger.info('Blog post created successfully', {
        post_id: post.id,
        status: data.status || 'draft',
        feed_id: data.source_feed_id,
        source_url: data.source_url,
      });

      return post.id;
    } catch (error: any) {
      await logger.error('Error creating blog post', {
        title: data.title,
        error: error?.message || error?.toString() || 'Unknown error',
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      return null;
    }
  }

  /**
   * Generate URL-safe slug from title
   *
   * @param title - Post title
   * @returns URL-safe slug
   */
  private generateSlug(title: string): string {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .substring(0, 100); // Limit length

    // Add timestamp suffix to ensure uniqueness
    const timestamp = Date.now().toString(36);
    return `${baseSlug}-${timestamp}`;
  }

  /**
   * Generate excerpt from content if not provided
   *
   * @param content - HTML content
   * @returns Plain text excerpt
   */
  private generateExcerpt(content: string): string {
    // Strip HTML tags
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    // Get first 160 characters
    if (plainText.length <= 160) {
      return plainText;
    }
    return plainText.substring(0, 157) + '...';
  }

  /**
   * Update post status
   *
   * @param postId - Post ID
   * @param status - New status
   * @returns Success status
   */
  async updateStatus(
    postId: string,
    status: PostStatus
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createAdminClient();

      const updateData: any = { status };

      // Set published_at if publishing for the first time
      if (status === 'published') {
        const { data: currentPost } = await supabase
          .from('posts')
          .select('published_at')
          .eq('id', postId)
          .single();

        if (!currentPost?.published_at) {
          updateData.published_at = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId);

      if (error) throw error;

      await logger.info('Post status updated', {
        post_id: postId,
        new_status: status,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await logger.error('Error updating post status', {
        post_id: postId,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get post by ID
   *
   * @param postId - Post ID
   * @returns Post or null
   */
  async getById(postId: string) {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) {
      await logger.error('Error fetching post', {
        post_id: postId,
        error: error.message,
      });
      return null;
    }

    return data;
  }

  /**
   * Get post by slug
   *
   * @param slug - Post slug
   * @returns Post or null
   */
  async getBySlug(slug: string) {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) return null;

    return data;
  }

  /**
   * Check if slug exists
   *
   * @param slug - Slug to check
   * @returns True if exists
   */
  async slugExists(slug: string): Promise<boolean> {
    const supabase = createAdminClient();

    const { data } = await supabase
      .from('posts')
      .select('id')
      .eq('slug', slug)
      .single();

    return !!data;
  }

  /**
   * Get post statistics
   *
   * @returns Statistics about posts
   */
  async getStats() {
    const supabase = createAdminClient();

    const { count: totalCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    const { count: publishedCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    const { count: draftCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft');

    const { count: recentCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    return {
      total_posts: totalCount || 0,
      published: publishedCount || 0,
      drafts: draftCount || 0,
      created_last_24h: recentCount || 0,
    };
  }
}

// Export singleton instance
export const postService = PostService.getInstance();
