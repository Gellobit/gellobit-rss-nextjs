import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/utils/supabase-server';
import { analyticsService } from '@/lib/services/analytics.service';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/admin/analytics
 * Get analytics data with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const feedId = searchParams.get('feed_id');

    let analytics;

    if (feedId) {
      analytics = await analyticsService.getFeedAnalytics(feedId, days);
    } else {
      analytics = await analyticsService.getGlobalAnalytics(days);
    }

    if (!analytics) {
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    return NextResponse.json({ analytics }, { status: 200 });
  } catch (error) {
    await logger.error('Error fetching analytics', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
