// @ts-nocheck - Supabase type inference issues with Next.js 15 route client
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { settingsService } from '@/lib/services/settings.service';

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

    // Get published opportunities count by type
    const { data: opportunitiesByType } = await adminSupabase
      .from('opportunities')
      .select('opportunity_type')
      .eq('status', 'published');

    // Group and count by opportunity_type
    const typeCounts: Record<string, number> = {};
    opportunitiesByType?.forEach((opp) => {
      const type = opp.opportunity_type || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    // Convert to array format sorted by count descending
    const opportunityTypeStats = Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

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

    // Calculate success rate from processing logs
    const logMaxEntries = await settingsService.get('advanced.log_max_entries') || 100;

    // Count published opportunities (within the log limit)
    const { count: publishedCount } = await adminSupabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(logMaxEntries);

    // Count draft opportunities (within the log limit)
    const { count: draftCount } = await adminSupabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(logMaxEntries);

    // Count rejection logs
    const { count: rejectedCount } = await adminSupabase
      .from('processing_logs')
      .select('*', { count: 'exact', head: true })
      .or('message.eq.Content rejected by AI,message.eq.Content rejected - below quality threshold')
      .order('created_at', { ascending: false })
      .limit(logMaxEntries);

    const totalProcessed = (publishedCount || 0) + (draftCount || 0) + (rejectedCount || 0);
    const successfulCount = (publishedCount || 0) + (draftCount || 0);
    const successRate = totalProcessed > 0 ? Math.round((successfulCount / totalProcessed) * 100) : 0;

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
      processing: {
        successRate,
        published: publishedCount || 0,
        drafts: draftCount || 0,
        rejected: rejectedCount || 0,
        total: totalProcessed,
        logLimit: logMaxEntries,
      },
      opportunityTypeStats,
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
