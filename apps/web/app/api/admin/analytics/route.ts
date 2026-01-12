// @ts-nocheck - Supabase type inference issues with Next.js 15 route client
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

/**
 * GET /api/admin/analytics
 * Get comprehensive analytics data
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

    // Get time range parameter
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '24h';

    // Calculate date boundaries
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date('2020-01-01'); // Far past date
        break;
    }

    // Feed Statistics
    const { data: feeds } = await adminSupabase
      .from('rss_feeds')
      .select('id, status');

    const feedStats = {
      totalFeeds: feeds?.length || 0,
      activeFeeds: feeds?.filter(f => f.status === 'active').length || 0,
      feedsWithErrors: feeds?.filter(f => f.status === 'error').length || 0,
    };

    // Post Statistics
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

    const { count: publishedPosts } = await adminSupabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    const { count: draftPosts } = await adminSupabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft');

    const { count: rejectedPosts } = await adminSupabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected');

    const postStats = {
      totalPosts: totalPosts || 0,
      postsToday: postsToday || 0,
      postsThisWeek: postsThisWeek || 0,
      publishedPosts: publishedPosts || 0,
      draftPosts: draftPosts || 0,
      rejectedPosts: rejectedPosts || 0,
    };

    // Processing Statistics (last 24h)
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { count: errors24h } = await adminSupabase
      .from('processing_logs')
      .select('*', { count: 'exact', head: true })
      .eq('level', 'error')
      .gte('created_at', last24h.toISOString());

    const { count: totalProcessed24h } = await adminSupabase
      .from('processing_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last24h.toISOString());

    const { data: lastProcessingLog } = await adminSupabase
      .from('processing_logs')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const successRate = totalProcessed24h > 0
      ? ((totalProcessed24h - (errors24h || 0)) / totalProcessed24h) * 100
      : 0;

    const processingStats = {
      errors24h: errors24h || 0,
      successRate,
      lastProcessing: lastProcessingLog?.created_at || null,
      totalProcessed24h: totalProcessed24h || 0,
      aiRejections24h: rejectedPosts || 0,
    };

    // Category Statistics (with view tracking)
    const { data: categoryData } = await adminSupabase
      .from('opportunities')
      .select('opportunity_type, status, view_count')
      .gte('created_at', startDate.toISOString());

    const categoryStatsMap: Record<string, any> = {};

    categoryData?.forEach((opp) => {
      if (!categoryStatsMap[opp.opportunity_type]) {
        categoryStatsMap[opp.opportunity_type] = {
          opportunity_type: opp.opportunity_type,
          total: 0,
          published: 0,
          rejected: 0,
          views: 0,
        };
      }

      const stat = categoryStatsMap[opp.opportunity_type];
      stat.total++;
      if (opp.status === 'published') stat.published++;
      if (opp.status === 'rejected') stat.rejected++;
      stat.views += opp.view_count || 0;
    });

    const categoryStats = Object.values(categoryStatsMap).map((stat: any) => ({
      ...stat,
      successRate: stat.total > 0 ? (stat.published / stat.total) * 100 : 0,
    })).sort((a, b) => b.views - a.views);

    // Top Performers (most viewed opportunities)
    const { data: topPerformers } = await adminSupabase
      .from('opportunities')
      .select('id, title, opportunity_type, view_count, created_at')
      .eq('status', 'published')
      .order('view_count', { ascending: false, nullsFirst: false })
      .limit(10);

    const analytics = {
      feedStats,
      postStats,
      processingStats,
      categoryStats,
      topPerformers: topPerformers?.map(opp => ({
        ...opp,
        views: opp.view_count || 0,
      })) || [],
    };

    return NextResponse.json(analytics, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
