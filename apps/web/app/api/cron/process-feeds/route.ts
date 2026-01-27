import { NextRequest, NextResponse } from 'next/server';
import { rssProcessorService } from '@/lib/services/rss-processor.service';
import { logger } from '@/lib/utils/logger';

/**
 * Shared processing logic for both GET (Vercel Cron) and POST (manual trigger)
 */
async function processFeeds(request: NextRequest) {
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
      await logger.warning('Unauthorized cron request', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await logger.info('Cron job started');

    // Process all RSS feeds
    const results = await rssProcessorService.processAllFeeds();

    const executionTime = Date.now() - startTime;

    // Aggregate results
    const summary = {
      total_feeds_processed: results.length,
      successful_feeds: results.filter((r) => r.success).length,
      failed_feeds: results.filter((r) => !r.success).length,
      total_items_processed: results.reduce((sum, r) => sum + r.itemsProcessed, 0),
      total_opportunities_created: results.reduce(
        (sum, r) => sum + r.opportunitiesCreated,
        0
      ),
      total_posts_created: results.reduce(
        (sum, r) => sum + r.postsCreated,
        0
      ),
      total_duplicates_skipped: results.reduce(
        (sum, r) => sum + r.duplicatesSkipped,
        0
      ),
      total_ai_rejections: results.reduce((sum, r) => sum + r.aiRejections, 0),
      total_errors: results.reduce((sum, r) => sum + r.errors, 0),
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString(),
    };

    await logger.info('Cron job completed', summary);

    return NextResponse.json(
      {
        success: true,
        message: 'RSS feeds processed successfully',
        summary,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await logger.error('Cron job failed', {
      error: errorMessage,
      execution_time_ms: executionTime,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: errorMessage,
        execution_time_ms: executionTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Vercel Cron Endpoint - Process RSS Feeds
 * Vercel Cron triggers GET requests automatically
 *
 * Security: Requires CRON_SECRET header to prevent unauthorized access
 *
 * @route GET /api/cron/process-feeds
 */
export async function GET(request: NextRequest) {
  return processFeeds(request);
}

/**
 * Manual trigger endpoint (e.g., curl -X POST)
 *
 * @route POST /api/cron/process-feeds
 */
export async function POST(request: NextRequest) {
  return processFeeds(request);
}
