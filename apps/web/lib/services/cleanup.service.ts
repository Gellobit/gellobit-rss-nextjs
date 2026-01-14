import { createAdminClient } from '../utils/supabase-admin';
import { logger } from '../utils/logger';
import { settingsService } from './settings.service';

/**
 * Cleanup Service - Manages expired opportunities
 * Removes opportunities that have passed their deadline to keep database clean
 */
export class CleanupService {
  private static instance: CleanupService;

  private constructor() {}

  static getInstance(): CleanupService {
    if (!CleanupService.instance) {
      CleanupService.instance = new CleanupService();
    }
    return CleanupService.instance;
  }

  /**
   * Find and delete expired opportunities
   * An opportunity is considered expired if:
   * - It has a deadline AND the deadline has passed (plus grace period)
   * - OR it has no deadline AND it's older than max age days
   *
   * @returns Cleanup result with counts
   */
  async cleanupExpiredOpportunities(): Promise<{
    success: boolean;
    deletedCount: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    const errors: string[] = [];
    let deletedCount = 0;

    try {
      const supabase = createAdminClient();

      // Get settings
      const daysAfterDeadline = await settingsService.get('cleanup.days_after_deadline') || 7;
      const maxAgeDaysNoDeadline = await settingsService.get('cleanup.max_age_days_no_deadline') || 30;

      // Calculate cutoff dates
      const now = new Date();
      const deadlineCutoff = new Date(now);
      deadlineCutoff.setDate(deadlineCutoff.getDate() - daysAfterDeadline);

      const noDeadlineCutoff = new Date(now);
      noDeadlineCutoff.setDate(noDeadlineCutoff.getDate() - maxAgeDaysNoDeadline);

      await logger.info('Starting cleanup of expired opportunities', {
        days_after_deadline: daysAfterDeadline,
        deadline_cutoff: deadlineCutoff.toISOString(),
        max_age_days_no_deadline: maxAgeDaysNoDeadline,
        no_deadline_cutoff: noDeadlineCutoff.toISOString(),
      });

      // 1. Find opportunities with deadline that have expired (deadline + grace period)
      const { data: expiredWithDeadline, error: error1 } = await supabase
        .from('opportunities')
        .select('id, title, deadline, opportunity_type')
        .eq('status', 'published')
        .not('deadline', 'is', null)
        .lt('deadline', deadlineCutoff.toISOString());

      if (error1) {
        errors.push(`Failed to query expired with deadline: ${error1.message}`);
        await logger.error('Failed to query expired opportunities with deadline', { error: error1.message });
      }

      // 2. Find opportunities without deadline that are too old
      const { data: expiredNoDeadline, error: error2 } = await supabase
        .from('opportunities')
        .select('id, title, created_at, opportunity_type')
        .eq('status', 'published')
        .is('deadline', null)
        .lt('created_at', noDeadlineCutoff.toISOString());

      if (error2) {
        errors.push(`Failed to query expired without deadline: ${error2.message}`);
        await logger.error('Failed to query expired opportunities without deadline', { error: error2.message });
      }

      // Combine all expired opportunities
      const allExpired = [
        ...(expiredWithDeadline || []).map(o => ({ ...o, reason: 'deadline_passed' })),
        ...(expiredNoDeadline || []).map(o => ({ ...o, reason: 'max_age_exceeded' })),
      ];

      if (allExpired.length === 0) {
        await logger.info('No expired opportunities found');
        return { success: true, deletedCount: 0, errors };
      }

      await logger.info(`Found ${allExpired.length} expired opportunities`, {
        with_deadline: expiredWithDeadline?.length || 0,
        without_deadline: expiredNoDeadline?.length || 0,
      });

      // Delete expired opportunities
      const idsToDelete = allExpired.map(o => o.id);

      // First, delete related records from duplicate_tracking
      const { error: dupError } = await supabase
        .from('duplicate_tracking')
        .delete()
        .in('opportunity_id', idsToDelete);

      if (dupError) {
        errors.push(`Failed to delete duplicate tracking records: ${dupError.message}`);
        await logger.warning('Failed to delete duplicate tracking records', { error: dupError.message });
      }

      // Delete the opportunities
      const { data: deleted, error: deleteError } = await supabase
        .from('opportunities')
        .delete()
        .in('id', idsToDelete)
        .select('id');

      if (deleteError) {
        errors.push(`Failed to delete opportunities: ${deleteError.message}`);
        await logger.error('Failed to delete expired opportunities', { error: deleteError.message });
      } else {
        deletedCount = deleted?.length || 0;
      }

      // Log each deleted opportunity
      for (const opp of allExpired) {
        await logger.info('Deleted expired opportunity', {
          opportunity_id: opp.id,
          title: opp.title,
          opportunity_type: opp.opportunity_type,
          reason: opp.reason,
          deadline: (opp as any).deadline,
        });
      }

      const executionTime = Date.now() - startTime;

      await logger.info('Cleanup completed', {
        deleted_count: deletedCount,
        execution_time_ms: executionTime,
        errors_count: errors.length,
      });

      return {
        success: errors.length === 0,
        deletedCount,
        errors,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(message);
      await logger.error('Cleanup failed', { error: message });

      return {
        success: false,
        deletedCount,
        errors,
      };
    }
  }

  /**
   * Get statistics about upcoming expirations
   * Useful for admin dashboard
   */
  async getExpirationStats(): Promise<{
    expiredCount: number;
    expiringIn7Days: number;
    expiringIn30Days: number;
    noDeadlineCount: number;
  }> {
    const supabase = createAdminClient();
    const now = new Date();

    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);

    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);

    // Count already expired
    const { count: expiredCount } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .not('deadline', 'is', null)
      .lt('deadline', now.toISOString());

    // Count expiring in next 7 days
    const { count: expiringIn7Days } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .not('deadline', 'is', null)
      .gte('deadline', now.toISOString())
      .lt('deadline', in7Days.toISOString());

    // Count expiring in next 30 days
    const { count: expiringIn30Days } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .not('deadline', 'is', null)
      .gte('deadline', now.toISOString())
      .lt('deadline', in30Days.toISOString());

    // Count with no deadline
    const { count: noDeadlineCount } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .is('deadline', null);

    return {
      expiredCount: expiredCount || 0,
      expiringIn7Days: expiringIn7Days || 0,
      expiringIn30Days: expiringIn30Days || 0,
      noDeadlineCount: noDeadlineCount || 0,
    };
  }
}

// Export singleton instance
export const cleanupService = CleanupService.getInstance();
