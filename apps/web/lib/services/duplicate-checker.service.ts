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
  existingEntityId?: string;
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
   * @param entityType - Type of entity to check for: 'opportunity' or 'post'
   * @returns Duplicate check result
   */
  async isDuplicate(
    scrapedContent: ScrapedContent,
    feedId?: string,
    entityType: 'opportunity' | 'post' = 'opportunity'
  ): Promise<DuplicateCheckResult> {
    try {
      const supabase = createAdminClient();

      // FIRST: Check if a post/opportunity with this source_url already exists
      // This is the most reliable check and doesn't depend on duplicate_tracking table
      if (entityType === 'post') {
        const { data: existingPost } = await supabase
          .from('posts')
          .select('id')
          .eq('source_url', scrapedContent.url)
          .single();

        if (existingPost) {
          await logger.info('Duplicate detected: post with same source_url exists', {
            url: scrapedContent.url,
            feed_id: feedId,
            entity_id: existingPost.id,
          });

          return {
            isDuplicate: true,
            reason: 'exact_url',
            existingEntityId: existingPost.id,
          };
        }
      } else {
        const { data: existingOpp } = await supabase
          .from('opportunities')
          .select('id')
          .eq('source_url', scrapedContent.url)
          .single();

        if (existingOpp) {
          await logger.info('Duplicate detected: opportunity with same source_url exists', {
            url: scrapedContent.url,
            feed_id: feedId,
            entity_id: existingOpp.id,
          });

          return {
            isDuplicate: true,
            reason: 'exact_url',
            existingEntityId: existingOpp.id,
          };
        }
      }

      // Generate hashes for additional checks
      const contentHash = generateHash(scrapedContent.content);
      const titleHash = generateHash(scrapedContent.title);
      const urlHash = generateHash(scrapedContent.url);

      // Check exact URL hash match in duplicate_tracking
      const { data: urlMatch } = await supabase
        .from('duplicate_tracking')
        .select('entity_id')
        .eq('url_hash', urlHash)
        .single();

      if (urlMatch) {
        await logger.info('Duplicate detected: exact URL hash match', {
          url: scrapedContent.url,
          feed_id: feedId,
          entity_id: urlMatch.entity_id,
        });

        return {
          isDuplicate: true,
          reason: 'exact_url',
          existingEntityId: urlMatch.entity_id,
        };
      }

      // Check exact content hash match
      const { data: contentMatch } = await supabase
        .from('duplicate_tracking')
        .select('entity_id')
        .eq('content_hash', contentHash)
        .single();

      if (contentMatch) {
        await logger.info('Duplicate detected: exact content match', {
          url: scrapedContent.url,
          feed_id: feedId,
          entity_id: contentMatch.entity_id,
        });

        return {
          isDuplicate: true,
          reason: 'exact_content',
          existingEntityId: contentMatch.entity_id,
        };
      }

      // Check exact title hash match
      const { data: titleMatch } = await supabase
        .from('duplicate_tracking')
        .select('entity_id')
        .eq('title_hash', titleHash)
        .single();

      if (titleMatch) {
        await logger.info('Duplicate detected: exact title match', {
          url: scrapedContent.url,
          feed_id: feedId,
          entity_id: titleMatch.entity_id,
        });

        return {
          isDuplicate: true,
          reason: 'exact_title',
          existingEntityId: titleMatch.entity_id,
        };
      }

      // Check for similar content (more expensive, do last)
      const similarityResult = await this.checkSimilarity(
        scrapedContent,
        contentHash,
        feedId,
        entityType
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
   * @param entityType - Type of entity to check: 'opportunity' or 'post'
   * @returns Duplicate check result
   */
  private async checkSimilarity(
    scrapedContent: ScrapedContent,
    contentHash: string,
    feedId?: string,
    entityType: 'opportunity' | 'post' = 'opportunity'
  ): Promise<DuplicateCheckResult> {
    try {
      const supabase = createAdminClient();

      // Get recent tracking records (last 30 days) to compare against
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentTracking } = await supabase
        .from('duplicate_tracking')
        .select('entity_id, content_hash, entity_type')
        .eq('entity_type', entityType)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .limit(100); // Limit to most recent 100 for performance

      if (!recentTracking || recentTracking.length === 0) {
        return { isDuplicate: false };
      }

      // Get full content for similarity comparison from the appropriate table
      const entityIds = recentTracking.map((t) => t.entity_id);
      const tableName = entityType === 'post' ? 'posts' : 'opportunities';

      const { data: entities } = await supabase
        .from(tableName)
        .select('id, content')
        .in('id', entityIds);

      if (!entities || entities.length === 0) {
        return { isDuplicate: false };
      }

      // Calculate similarity for each entity
      for (const entity of entities) {
        const similarity = calculateSimilarity(
          scrapedContent.content,
          entity.content
        );

        if (similarity >= this.SIMILARITY_THRESHOLD) {
          await logger.info('Duplicate detected: similar content', {
            url: scrapedContent.url,
            feed_id: feedId,
            entity_id: entity.id,
            entity_type: entityType,
            similarity: similarity.toFixed(2),
          });

          return {
            isDuplicate: true,
            reason: 'similar_content',
            similarity,
            existingEntityId: entity.id,
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
   * @param entityId - ID of created opportunity or post
   * @param feedId - Feed ID (required for clearing duplicates per feed)
   * @param entityType - Type of entity: 'opportunity' or 'post'
   * @returns Success status
   */
  async recordContent(
    scrapedContent: ScrapedContent,
    entityId: string,
    feedId?: string,
    entityType: 'opportunity' | 'post' = 'opportunity'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const contentHash = generateHash(scrapedContent.content);
      const titleHash = generateHash(scrapedContent.title);
      const urlHash = generateHash(scrapedContent.url);

      const supabase = createAdminClient();

      const { error } = await supabase.from('duplicate_tracking').insert({
        entity_id: entityId,
        entity_type: entityType,
        feed_id: feedId || null, // Store feed_id for per-feed duplicate clearing
        content_hash: contentHash,
        title_hash: titleHash,
        url_hash: urlHash,
      });

      if (error) throw error;

      await logger.debug('Content recorded in duplicate tracking', {
        entity_id: entityId,
        entity_type: entityType,
        feed_id: feedId,
      });

      return { success: true };
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';

      await logger.error('Error recording duplicate tracking', {
        entity_id: entityId,
        entity_type: entityType,
        feed_id: feedId,
        error: errorMessage,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
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
