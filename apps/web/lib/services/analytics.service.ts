import { createAdminClient } from '../utils/supabase-admin';
import { logger } from '../utils/logger';
import type { OpportunityType, FeedStatus } from '../types/database.types';

/**
 * Processing result for analytics
 */
export interface ProcessingResult {
  feedId: string;
  opportunityType: OpportunityType;
  itemsProcessed: number;
  opportunitiesCreated: number;
  duplicatesSkipped: number;
  aiRejections: number;
  errors: number;
  executionTimeMs: number;
}

/**
 * Analytics Service - Track metrics and statistics
 */
export class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Record processing result metrics
   *
   * @param result - Processing result
   * @returns Success status
   */
  async recordProcessing(
    result: ProcessingResult
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createAdminClient();

      const { error } = await supabase.from('analytics').insert({
        feed_id: result.feedId,
        opportunity_type: result.opportunityType,
        items_processed: result.itemsProcessed,
        opportunities_created: result.opportunitiesCreated,
        duplicates_skipped: result.duplicatesSkipped,
        ai_rejections: result.aiRejections,
        errors: result.errors,
        execution_time_ms: result.executionTimeMs,
      });

      if (error) throw error;

      await logger.debug('Analytics recorded', {
        feed_id: result.feedId,
        opportunities_created: result.opportunitiesCreated,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await logger.error('Error recording analytics', {
        feed_id: result.feedId,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get analytics for a specific feed
   *
   * @param feedId - Feed ID
   * @param days - Number of days to query (default 30)
   * @returns Analytics data
   */
  async getFeedAnalytics(feedId: string, days: number = 30) {
    const supabase = createAdminClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('feed_id', feedId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      await logger.error('Error fetching feed analytics', {
        feed_id: feedId,
        error: error.message,
      });
      return null;
    }

    // Aggregate metrics
    const metrics = this.aggregateMetrics(data || []);

    return {
      feed_id: feedId,
      period_days: days,
      ...metrics,
      daily_data: data || [],
    };
  }

  /**
   * Get global analytics across all feeds
   *
   * @param days - Number of days to query (default 30)
   * @returns Global analytics
   */
  async getGlobalAnalytics(days: number = 30) {
    const supabase = createAdminClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      await logger.error('Error fetching global analytics', {
        error: error.message,
      });
      return null;
    }

    const metrics = this.aggregateMetrics(data || []);

    // Get breakdown by opportunity type
    const byType = this.groupByType(data || []);

    return {
      period_days: days,
      ...metrics,
      by_opportunity_type: byType,
    };
  }

  /**
   * Aggregate metrics from analytics records
   *
   * @param records - Analytics records
   * @returns Aggregated metrics
   */
  private aggregateMetrics(records: any[]) {
    const totalProcessed = records.reduce(
      (sum, r) => sum + (r.items_processed || 0),
      0
    );
    const totalCreated = records.reduce(
      (sum, r) => sum + (r.opportunities_created || 0),
      0
    );
    const totalDuplicates = records.reduce(
      (sum, r) => sum + (r.duplicates_skipped || 0),
      0
    );
    const totalRejections = records.reduce(
      (sum, r) => sum + (r.ai_rejections || 0),
      0
    );
    const totalErrors = records.reduce((sum, r) => sum + (r.errors || 0), 0);
    const avgExecutionTime =
      records.length > 0
        ? records.reduce((sum, r) => sum + (r.execution_time_ms || 0), 0) /
          records.length
        : 0;

    return {
      total_items_processed: totalProcessed,
      total_opportunities_created: totalCreated,
      total_duplicates_skipped: totalDuplicates,
      total_ai_rejections: totalRejections,
      total_errors: totalErrors,
      avg_execution_time_ms: Math.round(avgExecutionTime),
      success_rate:
        totalProcessed > 0
          ? ((totalCreated / totalProcessed) * 100).toFixed(2)
          : '0.00',
      processing_runs: records.length,
    };
  }

  /**
   * Group metrics by opportunity type
   *
   * @param records - Analytics records
   * @returns Metrics grouped by type
   */
  private groupByType(records: any[]) {
    const grouped: Record<string, any> = {};

    for (const record of records) {
      const type = record.opportunity_type;
      if (!grouped[type]) {
        grouped[type] = {
          items_processed: 0,
          opportunities_created: 0,
          duplicates_skipped: 0,
          ai_rejections: 0,
        };
      }

      grouped[type].items_processed += record.items_processed || 0;
      grouped[type].opportunities_created += record.opportunities_created || 0;
      grouped[type].duplicates_skipped += record.duplicates_skipped || 0;
      grouped[type].ai_rejections += record.ai_rejections || 0;
    }

    return grouped;
  }

  /**
   * Get feed performance ranking
   *
   * @param days - Number of days to query (default 30)
   * @returns Top performing feeds
   */
  async getFeedRanking(days: number = 30) {
    const supabase = createAdminClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('analytics')
      .select('feed_id, opportunities_created')
      .gte('created_at', startDate.toISOString());

    if (error) return [];

    // Group by feed and sum opportunities
    const feedTotals: Record<string, number> = {};
    for (const record of data || []) {
      if (!feedTotals[record.feed_id]) {
        feedTotals[record.feed_id] = 0;
      }
      feedTotals[record.feed_id] += record.opportunities_created || 0;
    }

    // Convert to array and sort
    const ranking = Object.entries(feedTotals)
      .map(([feed_id, opportunities_created]) => ({
        feed_id,
        opportunities_created,
      }))
      .sort((a, b) => b.opportunities_created - a.opportunities_created)
      .slice(0, 10); // Top 10

    return ranking;
  }

  /**
   * Clean up old analytics records
   *
   * @param daysToKeep - Number of days to keep (default 90)
   * @returns Number of records deleted
   */
  async cleanupOldRecords(daysToKeep: number = 90): Promise<number> {
    try {
      const supabase = createAdminClient();

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await supabase
        .from('analytics')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) throw error;

      const deletedCount = data?.length || 0;

      await logger.info('Old analytics records cleaned up', {
        deleted_count: deletedCount,
        days_kept: daysToKeep,
      });

      return deletedCount;
    } catch (error) {
      await logger.error('Error cleaning up analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return 0;
    }
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance();
