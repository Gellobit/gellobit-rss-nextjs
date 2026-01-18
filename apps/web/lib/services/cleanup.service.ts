import { createAdminClient } from '../utils/supabase-admin';
import { logger } from '../utils/logger';
import { settingsService, CleanupMaxAgeByType } from './settings.service';
import { OpportunityType } from '../types/database.types';

/**
 * Cleanup Service - Manages expired opportunities
 * Removes opportunities that have passed their deadline to keep database clean
 * Supports per-opportunity-type configuration for max age
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
   * - OR it has no deadline AND it's older than max age days for its type
   *
   * Types with max_age = -1 are NEVER deleted (evergreen content)
   *
   * @returns Cleanup result with counts
   */
  async cleanupExpiredOpportunities(): Promise<{
    success: boolean;
    deletedCount: number;
    deletedByType: Record<string, number>;
    skippedEvergreen: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    const errors: string[] = [];
    let deletedCount = 0;
    const deletedByType: Record<string, number> = {};
    let skippedEvergreen = 0;

    try {
      const supabase = createAdminClient();

      // Get settings
      const daysAfterDeadline = await settingsService.get('cleanup.days_after_deadline') || 7;
      const maxAgeByType = await settingsService.get('cleanup.max_age_by_type');

      // Calculate deadline cutoff (same for all types)
      const now = new Date();
      const deadlineCutoff = new Date(now);
      deadlineCutoff.setDate(deadlineCutoff.getDate() - daysAfterDeadline);

      await logger.info('Starting cleanup of expired opportunities', {
        days_after_deadline: daysAfterDeadline,
        deadline_cutoff: deadlineCutoff.toISOString(),
        max_age_by_type: maxAgeByType,
      });

      // 1. Find opportunities WITH deadline that have expired (deadline + grace period)
      // These are deleted regardless of type (except evergreen types)
      const { data: expiredWithDeadline, error: error1 } = await supabase
        .from('opportunities')
        .select('id, title, deadline, opportunity_type, created_at')
        .eq('status', 'published')
        .not('deadline', 'is', null)
        .lt('deadline', deadlineCutoff.toISOString());

      if (error1) {
        errors.push(`Failed to query expired with deadline: ${error1.message}`);
        await logger.error('Failed to query expired opportunities with deadline', { error: error1.message });
      }

      // Filter out types that should never be deleted
      const expiredWithDeadlineFiltered = (expiredWithDeadline || []).filter(o => {
        const typeKey = o.opportunity_type as keyof CleanupMaxAgeByType;
        const maxAge = maxAgeByType[typeKey];
        if (maxAge === -1) {
          skippedEvergreen++;
          return false;
        }
        return true;
      });

      // 2. Find opportunities WITHOUT deadline - need to check per type
      const { data: allNoDeadline, error: error2 } = await supabase
        .from('opportunities')
        .select('id, title, created_at, opportunity_type')
        .eq('status', 'published')
        .is('deadline', null);

      if (error2) {
        errors.push(`Failed to query opportunities without deadline: ${error2.message}`);
        await logger.error('Failed to query opportunities without deadline', { error: error2.message });
      }

      // Filter opportunities without deadline based on per-type max age
      const expiredNoDeadlineFiltered = (allNoDeadline || []).filter(o => {
        const typeKey = o.opportunity_type as keyof CleanupMaxAgeByType;
        const maxAgeDays = maxAgeByType[typeKey];

        // Skip types that should never be deleted
        if (maxAgeDays === -1) {
          skippedEvergreen++;
          return false;
        }

        // Calculate cutoff for this specific type
        const typeCutoff = new Date(now);
        typeCutoff.setDate(typeCutoff.getDate() - maxAgeDays);

        // Check if opportunity is older than the type-specific cutoff
        const createdAt = new Date(o.created_at);
        return createdAt < typeCutoff;
      });

      // Combine all expired opportunities
      const allExpired = [
        ...expiredWithDeadlineFiltered.map(o => ({ ...o, reason: 'deadline_passed' as const })),
        ...expiredNoDeadlineFiltered.map(o => ({ ...o, reason: 'max_age_exceeded' as const })),
      ];

      if (allExpired.length === 0) {
        await logger.info('No expired opportunities found', {
          skipped_evergreen: skippedEvergreen,
        });
        return { success: true, deletedCount: 0, deletedByType: {}, skippedEvergreen, errors };
      }

      await logger.info(`Found ${allExpired.length} expired opportunities`, {
        with_deadline: expiredWithDeadlineFiltered.length,
        without_deadline: expiredNoDeadlineFiltered.length,
        skipped_evergreen: skippedEvergreen,
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

      // Log each deleted opportunity and count by type
      for (const opp of allExpired) {
        const typeKey = opp.opportunity_type;
        deletedByType[typeKey] = (deletedByType[typeKey] || 0) + 1;

        await logger.info('Deleted expired opportunity', {
          opportunity_id: opp.id,
          title: opp.title,
          opportunity_type: opp.opportunity_type,
          reason: opp.reason,
          deadline: (opp as any).deadline,
          created_at: opp.created_at,
        });
      }

      const executionTime = Date.now() - startTime;

      await logger.info('Cleanup completed', {
        deleted_count: deletedCount,
        deleted_by_type: deletedByType,
        skipped_evergreen: skippedEvergreen,
        execution_time_ms: executionTime,
        errors_count: errors.length,
      });

      return {
        success: errors.length === 0,
        deletedCount,
        deletedByType,
        skippedEvergreen,
        errors,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(message);
      await logger.error('Cleanup failed', { error: message });

      return {
        success: false,
        deletedCount,
        deletedByType,
        skippedEvergreen,
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
