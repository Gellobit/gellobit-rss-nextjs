import { NextRequest, NextResponse } from 'next/server';
import { cleanupService } from '@/lib/services/cleanup.service';
import { logger } from '@/lib/utils/logger';

/**
 * Vercel Cron Endpoint - Cleanup Expired Opportunities
 * Triggered automatically by Vercel Cron (daily at 3am UTC)
 *
 * This cron job removes expired opportunities to keep the database clean.
 * It does NOT affect blog posts (posts table) which are evergreen content.
 *
 * Cleanup logic:
 * - Opportunities WITH deadline: deleted X days after deadline passes
 * - Opportunities WITHOUT deadline: deleted after Y days of age
 * - Blog posts: NEVER deleted (separate table, managed manually)
 *
 * Security: Requires CRON_SECRET header to prevent unauthorized access
 *
 * @route POST /api/cron/cleanup
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      await logger.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      await logger.warning('Unauthorized cleanup cron request', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await logger.info('Cleanup cron job started');

    // Get pre-cleanup statistics
    const statsBefore = await cleanupService.getExpirationStats();

    await logger.info('Pre-cleanup statistics', {
      expired_count: statsBefore.expiredCount,
      expiring_in_7_days: statsBefore.expiringIn7Days,
      expiring_in_30_days: statsBefore.expiringIn30Days,
      no_deadline_count: statsBefore.noDeadlineCount,
    });

    // Run cleanup
    const result = await cleanupService.cleanupExpiredOpportunities();

    const executionTime = Date.now() - startTime;

    // Log completion
    await logger.info('Cleanup cron job completed', {
      success: result.success,
      deleted_count: result.deletedCount,
      errors_count: result.errors.length,
      execution_time_ms: executionTime,
    });

    return NextResponse.json({
      success: result.success,
      deleted_count: result.deletedCount,
      deleted_by_type: result.deletedByType,
      skipped_evergreen: result.skippedEvergreen,
      errors: result.errors,
      stats_before: statsBefore,
      execution_time_ms: executionTime,
      message: result.deletedCount > 0
        ? `Cleanup completed. Deleted ${result.deletedCount} expired opportunities.${result.skippedEvergreen > 0 ? ` Skipped ${result.skippedEvergreen} items (never expire).` : ''}`
        : `Cleanup completed. No expired opportunities found.${result.skippedEvergreen > 0 ? ` Skipped ${result.skippedEvergreen} items (never expire).` : ''}`,
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await logger.error('Cleanup cron job failed', {
      error: errorMessage,
      execution_time_ms: executionTime,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Cleanup failed',
        details: errorMessage,
        execution_time_ms: executionTime,
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for health checks
 * Returns current expiration statistics without performing cleanup
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stats = await cleanupService.getExpirationStats();

    return NextResponse.json({
      success: true,
      stats,
      message: 'Cleanup cron endpoint is healthy',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
