// @ts-nocheck - Supabase type inference issues with Next.js 15 route client
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 */
export async function GET(request: NextRequest) {
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

    // Get system status
    const { data: feeds } = await adminSupabase
      .from('rss_feeds')
      .select('id, status, last_fetched');

    const totalFeeds = feeds?.length || 0;
    const activeFeeds = feeds?.filter(f => f.status === 'active').length || 0;
    const lastProcessing = feeds?.reduce((latest, feed) => {
      if (!feed.last_fetched) return latest;
      const feedDate = new Date(feed.last_fetched);
      return !latest || feedDate > new Date(latest) ? feed.last_fetched : latest;
    }, null as string | null);

    // Get posts statistics
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { count: totalPosts } = await adminSupabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true });

    const { count: postsToday } = await adminSupabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    const { count: postsThisWeek } = await adminSupabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString());

    // Get feed details for display
    const { data: feedDetails } = await adminSupabase
      .from('rss_feeds')
      .select('id, name, status, opportunity_type, last_fetched')
      .order('last_fetched', { ascending: false, nullsFirst: false })
      .limit(6);

    // Get recent activity from processing logs
    const { data: recentLogs } = await adminSupabase
      .from('processing_logs')
      .select('id, message, level, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    const recentActivity = recentLogs?.map(log => ({
      id: log.id,
      message: log.message,
      timestamp: log.created_at,
      type: log.level === 'error' ? 'error' :
            log.level === 'warn' ? 'warning' :
            log.level === 'info' ? 'info' : 'success'
    })) || [];

    const stats = {
      system: {
        status: activeFeeds > 0 ? 'operational' : 'warning',
        lastProcessing,
        activeFeeds,
        totalFeeds,
      },
      posts: {
        today: postsToday || 0,
        thisWeek: postsThisWeek || 0,
        total: totalPosts || 0,
      },
      feeds: feedDetails || [],
      recentActivity,
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
