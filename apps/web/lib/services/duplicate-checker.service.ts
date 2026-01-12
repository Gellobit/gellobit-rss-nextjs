import { createAdminClient } from '../utils/supabase-admin';
import { generateHash, calculateSimilarity } from '../utils/crypto';
import { logger } from '../utils/logger';
import type { ScrapedContent } from '../../prompts';

/**
 * Duplicate detection result
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  reason?: 'exact_url' | 'exact_content' | 'exact_title' | 'similar_content';
  similarity?: number;
  existingOpportunityId?: string;
}

/**
 * Duplicate Checker Service - Hash-based duplicate detection
 * Prevents duplicate opportunities from being created
 */
export class DuplicateCheckerService {
  private static instance: DuplicateCheckerService;
  private readonly SIMILARITY_THRESHOLD = 0.85; // 85% similarity = duplicate

  private constructor() {}

  static getInstance(): DuplicateCheckerService {
    if (!DuplicateCheckerService.instance) {
      DuplicateCheckerService.instance = new DuplicateCheckerService();
    }
    return DuplicateCheckerService.instance;
  }

  /**
   * Check if content is a duplicate
   *
   * @param scrapedContent - Content to check
   * @param feedId - Feed ID for logging
   * @returns Duplicate check result
   */
  async isDuplicate(
    scrapedContent: ScrapedContent,
    feedId?: string
  ): Promise<DuplicateCheckResult> {
    try {
      // Generate hashes
      const contentHash = generateHash(scrapedContent.content);
      const titleHash = generateHash(scrapedContent.title);
      const urlHash = generateHash(scrapedContent.url);

      const supabase = createAdminClient();

      // Check exact URL hash match
      const { data: urlMatch } = await supabase
        .from('duplicate_tracking')
        .select('opportunity_id')
        .eq('url_hash', urlHash)
        .single();

      if (urlMatch) {
        await logger.info('Duplicate detected: exact URL match', {
          url: scrapedContent.url,
          feed_id: feedId,
          opportunity_id: urlMatch.opportunity_id,
        });

        return {
          isDuplicate: true,
          reason: 'exact_url',
          existingOpportunityId: urlMatch.opportunity_id,
        };
      }

      // Check exact content hash match
      const { data: contentMatch } = await supabase
        .from('duplicate_tracking')
        .select('opportunity_id')
        .eq('content_hash', contentHash)
        .single();

      if (contentMatch) {
        await logger.info('Duplicate detected: exact content match', {
          url: scrapedContent.url,
          feed_id: feedId,
          opportunity_id: contentMatch.opportunity_id,
        });

        return {
          isDuplicate: true,
          reason: 'exact_content',
          existingOpportunityId: contentMatch.opportunity_id,
        };
      }

      // Check exact title hash match
      const { data: titleMatch } = await supabase
        .from('duplicate_tracking')
        .select('opportunity_id')
        .eq('title_hash', titleHash)
        .single();

      if (titleMatch) {
        await logger.info('Duplicate detected: exact title match', {
          url: scrapedContent.url,
          feed_id: feedId,
          opportunity_id: titleMatch.opportunity_id,
        });

        return {
          isDuplicate: true,
          reason: 'exact_title',
          existingOpportunityId: titleMatch.opportunity_id,
        };
      }

      // Check for similar content (more expensive, do last)
      const similarityResult = await this.checkSimilarity(
        scrapedContent,
        contentHash,
        feedId
      );

      if (similarityResult.isDuplicate) {
        return similarityResult;
      }

      // Not a duplicate
      await logger.debug('Content is unique', {
        url: scrapedContent.url,
        feed_id: feedId,
      });

      return { isDuplicate: false };
    } catch (error) {
      await logger.error('Error checking duplicates', {
        url: scrapedContent.url,
        feed_id: feedId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // On error, assume not duplicate to avoid blocking processing
      return { isDuplicate: false };
    }
  }

  /**
   * Check for similar content using Levenshtein distance
   *
   * @param scrapedContent - Content to check
   * @param contentHash - Hash of content
   * @param feedId - Feed ID for logging
   * @returns Duplicate check result
   */
  private async checkSimilarity(
    scrapedContent: ScrapedContent,
    contentHash: string,
    feedId?: string
  ): Promise<DuplicateCheckResult> {
    try {
      const supabase = createAdminClient();

      // Get recent opportunities (last 30 days) to compare against
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentTracking } = await supabase
        .from('duplicate_tracking')
        .select('opportunity_id, content_hash')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .limit(100); // Limit to most recent 100 for performance

      if (!recentTracking || recentTracking.length === 0) {
        return { isDuplicate: false };
      }

      // Get full content for similarity comparison
      const opportunityIds = recentTracking.map((t) => t.opportunity_id);

      const { data: opportunities } = await supabase
        .from('opportunities')
        .select('id, content')
        .in('id', opportunityIds);

      if (!opportunities || opportunities.length === 0) {
        return { isDuplicate: false };
      }

      // Calculate similarity for each opportunity
      for (const opp of opportunities) {
        const similarity = calculateSimilarity(
          scrapedContent.content,
          opp.content
        );

        if (similarity >= this.SIMILARITY_THRESHOLD) {
          await logger.info('Duplicate detected: similar content', {
            url: scrapedContent.url,
            feed_id: feedId,
            opportunity_id: opp.id,
            similarity: similarity.toFixed(2),
          });

          return {
            isDuplicate: true,
            reason: 'similar_content',
            similarity,
            existingOpportunityId: opp.id,
          };
        }
      }

      return { isDuplicate: false };
    } catch (error) {
      await logger.error('Error checking similarity', {
        url: scrapedContent.url,
        feed_id: feedId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return { isDuplicate: false };
    }
  }

  /**
   * Record content in duplicate tracking table
   *
   * @param scrapedContent - Content to record
   * @param opportunityId - ID of created opportunity
   * @param feedId - Feed ID for logging
   * @returns Success status
   */
  async recordContent(
    scrapedContent: ScrapedContent,
    opportunityId: string,
    feedId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const contentHash = generateHash(scrapedContent.content);
      const titleHash = generateHash(scrapedContent.title);
      const urlHash = generateHash(scrapedContent.url);

      const supabase = createAdminClient();

      const { error } = await supabase.from('duplicate_tracking').insert({
        opportunity_id: opportunityId,
        content_hash: contentHash,
        title_hash: titleHash,
        url_hash: urlHash,
      });

      if (error) throw error;

      await logger.debug('Content recorded in duplicate tracking', {
        opportunity_id: opportunityId,
        feed_id: feedId,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await logger.error('Error recording duplicate tracking', {
        opportunity_id: opportunityId,
        feed_id: feedId,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Clean up old duplicate tracking records
   * Removes records older than specified days
   *
   * @param daysToKeep - Number of days to keep records (default 90)
   * @returns Number of records deleted
   */
  async cleanupOldRecords(daysToKeep: number = 90): Promise<number> {
    try {
      const supabase = createAdminClient();

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await supabase
        .from('duplicate_tracking')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) throw error;

      const deletedCount = data?.length || 0;

      await logger.info('Old duplicate tracking records cleaned up', {
        deleted_count: deletedCount,
        days_kept: daysToKeep,
      });

      return deletedCount;
    } catch (error) {
      await logger.error('Error cleaning up duplicate tracking', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return 0;
    }
  }

  /**
   * Get duplicate detection statistics
   *
   * @returns Statistics about duplicate detection
   */
  async getStats() {
    const supabase = createAdminClient();

    // Total tracked
    const { count: totalTracked } = await supabase
      .from('duplicate_tracking')
      .select('*', { count: 'exact', head: true });

    // Last 24 hours
    const { data: recentLogs } = await supabase
      .from('processing_logs')
      .select('message, context')
      .ilike('message', '%duplicate%')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const duplicatesDetected =
      recentLogs?.filter((l) => l.message.includes('Duplicate detected'))
        .length || 0;

    const uniqueContent =
      recentLogs?.filter((l) => l.message.includes('Content is unique'))
        .length || 0;

    return {
      total_tracked: totalTracked || 0,
      duplicates_detected_24h: duplicatesDetected,
      unique_content_24h: uniqueContent,
      detection_rate:
        duplicatesDetected + uniqueContent > 0
          ? (duplicatesDetected / (duplicatesDetected + uniqueContent)) * 100
          : 0,
    };
  }
}

// Export singleton instance
export const duplicateCheckerService = DuplicateCheckerService.getInstance();
