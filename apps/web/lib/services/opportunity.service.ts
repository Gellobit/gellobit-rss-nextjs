import { createAdminClient } from '../utils/supabase-admin';
import { logger } from '../utils/logger';
import { notificationService } from './notification.service';
import type { AIGeneratedContent } from '../types/ai.types';
import type { OpportunityType, OpportunityStatus } from '../types/database.types';

/**
 * Create opportunity data
 */
export interface CreateOpportunityData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  opportunity_type: OpportunityType;
  source_url: string;
  source_feed_id: string;
  deadline?: string | null;
  prize_value?: string | null;
  requirements?: string | null;
  location?: string | null;
  confidence_score?: number | null;
  featured_image_url?: string | null;
  status?: OpportunityStatus;
  auto_publish?: boolean;
}

/**
 * Opportunity Service - CRUD operations for opportunities
 */
export class OpportunityService {
  private static instance: OpportunityService;

  private constructor() {}

  static getInstance(): OpportunityService {
    if (!OpportunityService.instance) {
      OpportunityService.instance = new OpportunityService();
    }
    return OpportunityService.instance;
  }

  /**
   * Create a new opportunity from AI-generated content
   *
   * @param aiContent - AI-generated content
   * @param opportunityType - Type of opportunity
   * @param sourceUrl - Source URL
   * @param sourceFeedId - Source feed ID
   * @param autoPublish - Auto-publish based on feed settings
   * @param featuredImageUrl - Featured image URL (from scraper or fallback)
   * @returns Created opportunity ID or null
   */
  async createFromAI(
    aiContent: AIGeneratedContent,
    opportunityType: OpportunityType,
    sourceUrl: string,
    sourceFeedId: string,
    autoPublish: boolean = false,
    featuredImageUrl?: string | null
  ): Promise<string | null> {
    if (!aiContent.valid || !aiContent.title || !aiContent.excerpt || !aiContent.content) {
      await logger.warning('Cannot create opportunity from invalid AI content', {
        opportunity_type: opportunityType,
        source_url: sourceUrl,
        feed_id: sourceFeedId,
      });
      return null;
    }

    try {
      const slug = this.generateSlug(aiContent.title);

      const opportunityData: CreateOpportunityData = {
        title: aiContent.title,
        slug,
        excerpt: aiContent.excerpt,
        content: aiContent.content,
        opportunity_type: opportunityType,
        source_url: sourceUrl,
        source_feed_id: sourceFeedId,
        deadline: aiContent.deadline || null,
        prize_value: aiContent.prize_value || null,
        requirements: aiContent.requirements || null,
        location: aiContent.location || null,
        confidence_score: aiContent.confidence_score || null,
        featured_image_url: featuredImageUrl || null,
        status: autoPublish ? 'published' : 'draft',
      };

      return await this.create(opportunityData);
    } catch (error) {
      await logger.error('Error creating opportunity from AI', {
        opportunity_type: opportunityType,
        source_url: sourceUrl,
        feed_id: sourceFeedId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Create a new opportunity
   *
   * @param data - Opportunity data
   * @returns Created opportunity ID or null
   */
  async create(data: CreateOpportunityData): Promise<string | null> {
    try {
      const supabase = createAdminClient();

      const { data: opportunity, error } = await supabase
        .from('opportunities')
        .insert({
          ...data,
          processed_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;

      await logger.info('Opportunity created successfully', {
        opportunity_id: opportunity.id,
        opportunity_type: data.opportunity_type,
        status: data.status || 'draft',
        feed_id: data.source_feed_id,
      });

      // Send in-app and email notifications if opportunity is published
      if (data.status === 'published') {
        this.sendNewOpportunityNotifications(
          opportunity.id,
          data.title,
          data.opportunity_type,
          data.slug,
          data.excerpt,
          data.deadline,
          data.prize_value,
          data.featured_image_url
        );
      }

      return opportunity.id;
    } catch (error) {
      await logger.error('Error creating opportunity', {
        opportunity_type: data.opportunity_type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Send notifications to users about a new opportunity
   * Runs asynchronously to not block opportunity creation
   */
  private async sendNewOpportunityNotifications(
    opportunityId: string,
    title: string,
    opportunityType: OpportunityType,
    slug: string,
    excerpt?: string,
    deadline?: string | null,
    prizeValue?: string | null,
    featuredImageUrl?: string | null
  ): Promise<void> {
    try {
      const count = await notificationService.notifyUsersAboutNewOpportunity({
        opportunityId,
        opportunityTitle: title,
        opportunityType,
        opportunitySlug: slug,
        opportunityExcerpt: excerpt,
        opportunityDeadline: deadline,
        opportunityPrizeValue: prizeValue,
        opportunityImageUrl: featuredImageUrl,
      });

      if (count > 0) {
        await logger.info('Notifications sent for new opportunity', {
          opportunity_id: opportunityId,
          notifications_sent: count,
        });
      }
    } catch (error) {
      // Don't let notification errors affect opportunity creation
      await logger.error('Error sending opportunity notifications', {
        opportunity_id: opportunityId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Create a rejected opportunity record (for logging AI rejections)
   *
   * @param title - Original title from scraped content
   * @param opportunityType - Type of opportunity
   * @param sourceUrl - Source URL
   * @param sourceFeedId - Source feed ID
   * @param rejectionReason - Reason for AI rejection
   * @param aiProvider - AI provider used
   * @returns Created opportunity ID or null
   */
  async createRejection(
    title: string,
    opportunityType: OpportunityType,
    sourceUrl: string,
    sourceFeedId: string,
    rejectionReason: string,
    aiProvider?: string | null
  ): Promise<string | null> {
    try {
      const supabase = createAdminClient();
      const slug = this.generateSlug(title || 'rejected-content');

      const { data: opportunity, error } = await supabase
        .from('opportunities')
        .insert({
          title: title || 'Untitled',
          slug,
          excerpt: rejectionReason,
          content: `<p>This content was rejected by AI processing.</p><p><strong>Reason:</strong> ${rejectionReason}</p>`,
          opportunity_type: opportunityType,
          source_url: sourceUrl,
          source_feed_id: sourceFeedId,
          status: 'rejected',
          rejection_reason: rejectionReason,
          ai_provider: aiProvider || null,
          processed_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;

      await logger.debug('AI rejection recorded', {
        opportunity_id: opportunity.id,
        opportunity_type: opportunityType,
        feed_id: sourceFeedId,
        reason: rejectionReason,
      });

      return opportunity.id;
    } catch (error) {
      await logger.error('Error recording AI rejection', {
        opportunity_type: opportunityType,
        source_url: sourceUrl,
        feed_id: sourceFeedId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Generate URL-safe slug from title
   *
   * @param title - Opportunity title
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
   * Update opportunity status
   *
   * @param opportunityId - Opportunity ID
   * @param status - New status
   * @returns Success status
   */
  async updateStatus(
    opportunityId: string,
    status: OpportunityStatus
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createAdminClient();

      // Get current opportunity to check if status is changing to published
      const { data: currentOpp } = await supabase
        .from('opportunities')
        .select('status, title, opportunity_type, slug, excerpt, deadline, prize_value, featured_image_url')
        .eq('id', opportunityId)
        .single();

      const wasNotPublished = currentOpp?.status !== 'published';

      const { error } = await supabase
        .from('opportunities')
        .update({ status })
        .eq('id', opportunityId);

      if (error) throw error;

      await logger.info('Opportunity status updated', {
        opportunity_id: opportunityId,
        new_status: status,
      });

      // Send notifications if status changed to published
      if (status === 'published' && wasNotPublished && currentOpp) {
        this.sendNewOpportunityNotifications(
          opportunityId,
          currentOpp.title,
          currentOpp.opportunity_type,
          currentOpp.slug,
          currentOpp.excerpt,
          currentOpp.deadline,
          currentOpp.prize_value,
          currentOpp.featured_image_url
        );
      }

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await logger.error('Error updating opportunity status', {
        opportunity_id: opportunityId,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete opportunity
   *
   * @param opportunityId - Opportunity ID
   * @returns Success status
   */
  async delete(opportunityId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createAdminClient();

      // Delete will cascade to duplicate_tracking due to FK constraint
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', opportunityId);

      if (error) throw error;

      await logger.info('Opportunity deleted', {
        opportunity_id: opportunityId,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await logger.error('Error deleting opportunity', {
        opportunity_id: opportunityId,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get opportunity by ID
   *
   * @param opportunityId - Opportunity ID
   * @returns Opportunity or null
   */
  async getById(opportunityId: string) {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (error) {
      await logger.error('Error fetching opportunity', {
        opportunity_id: opportunityId,
        error: error.message,
      });
      return null;
    }

    return data;
  }

  /**
   * Get opportunity by slug
   *
   * @param slug - Opportunity slug
   * @returns Opportunity or null
   */
  async getBySlug(slug: string) {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) return null;

    return data;
  }

  /**
   * List opportunities with pagination and filters
   *
   * @param options - Query options
   * @returns Paginated opportunities
   */
  async list(options: {
    page?: number;
    limit?: number;
    status?: OpportunityStatus;
    opportunity_type?: OpportunityType;
    feed_id?: string;
  } = {}) {
    const { page = 1, limit = 20, status, opportunity_type, feed_id } = options;

    const supabase = createAdminClient();
    let query = supabase.from('opportunities').select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (opportunity_type) {
      query = query.eq('opportunity_type', opportunity_type);
    }

    if (feed_id) {
      query = query.eq('source_feed_id', feed_id);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      await logger.error('Error listing opportunities', {
        error: error.message,
        ...options,
      });
      return { data: [], total: 0, page, limit };
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  /**
   * Get opportunity statistics
   *
   * @returns Statistics about opportunities
   */
  async getStats() {
    const supabase = createAdminClient();

    const { count: totalCount } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true });

    const { count: publishedCount } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    const { count: draftCount } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft');

    const { count: recentCount } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .gte(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    return {
      total_opportunities: totalCount || 0,
      published: publishedCount || 0,
      drafts: draftCount || 0,
      created_last_24h: recentCount || 0,
    };
  }
}

// Export singleton instance
export const opportunityService = OpportunityService.getInstance();
