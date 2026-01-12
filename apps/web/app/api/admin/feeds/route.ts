// @ts-nocheck - Supabase type inference issues with Next.js 15 route client
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { logger } from '@/lib/utils/logger';
import { safeParse, createFeedSchema } from '@/lib/utils/validation';

/**
 * GET /api/admin/feeds
 * List all RSS feeds
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated and admin
    const supabase = await createRouteClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get feeds
    const adminSupabase = createAdminClient();
    const { data: feeds, error } = await adminSupabase
      .from('rss_feeds')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ feeds: feeds || [] }, { status: 200 });
  } catch (error) {
    await logger.error('Error fetching feeds', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/feeds
 * Create new RSS feed
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated and admin
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

    // Validate request body
    const body = await request.json();
    const validation = safeParse(body, createFeedSchema);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      );
    }

    // Convert empty strings to null for AI fields
    const feedData = {
      ...validation.data,
      ai_provider: validation.data.ai_provider || null,
      ai_model: validation.data.ai_model || null,
      ai_api_key: validation.data.ai_api_key || null,
    };

    // Create feed
    const adminSupabase = createAdminClient();
    const { data: feed, error } = await adminSupabase
      .from('rss_feeds')
      .insert(feedData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await logger.info('RSS feed created', {
      feed_id: feed.id,
      feed_name: feed.name,
      user_id: user.id,
    });

    return NextResponse.json({ feed }, { status: 201 });
  } catch (error) {
    await logger.error('Error creating feed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
