// @ts-nocheck - Supabase type inference issues with Next.js 15 route client
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { RSSProcessorService } from '@/lib/services/rss-processor.service';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/admin/feeds/process-all
 * Manually trigger processing of all active feeds
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated and admin
    const supabase = await createRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to check role
    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Log manual trigger
    await logger.info('Manual feed processing triggered', { user_id: user.id });

    // Process all feeds
    const rssProcessorService = RSSProcessorService.getInstance();
    const results = await rssProcessorService.processAllFeeds();

    // Calculate summary
    const summary = {
      total_feeds_processed: results.length,
      successful_feeds: results.filter((r) => r.success).length,
      failed_feeds: results.filter((r) => !r.success).length,
      total_opportunities_created: results.reduce((sum, r) => sum + r.opportunitiesCreated, 0),
      total_duplicates_skipped: results.reduce((sum, r) => sum + r.duplicatesSkipped, 0),
      total_ai_rejections: results.reduce((sum, r) => sum + r.aiRejections, 0),
      total_errors: results.reduce((sum, r) => sum + r.errors, 0),
    };

    // Log completion
    await logger.info('Manual feed processing completed', {
      user_id: user.id,
      summary
    });

    return NextResponse.json({
      success: true,
      summary,
      results
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error processing all feeds:', error);
    await logger.error('Error in manual feed processing', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
