import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const importFeedSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  opportunity_type: z.string(),
  status: z.enum(['active', 'inactive', 'error']).optional().default('active'),
  enable_scraping: z.boolean().optional().default(true),
  enable_ai_processing: z.boolean().optional().default(true),
  auto_publish: z.boolean().optional().default(false),
  ai_provider: z.string().nullable().optional(),
  ai_model: z.string().nullable().optional(),
  quality_threshold: z.number().optional().default(0.6),
  priority: z.number().optional().default(5),
  cron_interval: z.string().optional().default('hourly'),
  fallback_featured_image_url: z.string().nullable().optional(),
  allow_republishing: z.boolean().optional().default(false)
});

const importSchema = z.object({
  version: z.string().optional(),
  feeds: z.array(importFeedSchema)
});

/**
 * POST /api/admin/feeds/import
 * Import feeds from JSON
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate import data
    const validation = importSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid import format', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { feeds } = validation.data;

    if (!feeds || feeds.length === 0) {
      return NextResponse.json(
        { error: 'No feeds to import' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // Get existing feed URLs to avoid duplicates
    const { data: existingFeeds } = await adminSupabase
      .from('rss_feeds')
      .select('url');

    const existingUrls = new Set(existingFeeds?.map(f => f.url) || []);

    // Filter out duplicates and prepare feeds for insert
    const newFeeds = feeds
      .filter(feed => !existingUrls.has(feed.url))
      .map(feed => ({
        ...feed,
        ai_provider: feed.ai_provider || null,
        ai_model: feed.ai_model || null,
        fallback_featured_image_url: feed.fallback_featured_image_url || null
      }));

    const skippedCount = feeds.length - newFeeds.length;

    if (newFeeds.length === 0) {
      return NextResponse.json({
        message: 'All feeds already exist',
        imported: 0,
        skipped: skippedCount
      });
    }

    // Insert new feeds
    const { data: insertedFeeds, error } = await adminSupabase
      .from('rss_feeds')
      .insert(newFeeds)
      .select();

    if (error) {
      throw error;
    }

    await logger.info('Feeds imported', {
      user_id: user.id,
      imported_count: insertedFeeds?.length || 0,
      skipped_count: skippedCount
    });

    return NextResponse.json({
      message: 'Feeds imported successfully',
      imported: insertedFeeds?.length || 0,
      skipped: skippedCount
    });
  } catch (error) {
    console.error('Import error:', error);

    await logger.error('Error importing feeds', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
