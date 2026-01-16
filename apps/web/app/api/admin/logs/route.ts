// @ts-nocheck - Supabase type inference issues with Next.js 15 route client
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { settingsService } from '@/lib/services/settings.service';
import { logger } from '@/lib/utils/logger';

interface LogEntry {
  id: string;
  date: string;
  feed_name: string;
  category: string;
  provider: string;
  title: string;
  status: 'published' | 'rejected' | 'draft';
  reason: string;
  source_url: string;
  opportunity_id: string | null;
  opportunity_slug: string | null;
  confidence_score: number | null;
}

/**
 * GET /api/admin/logs
 * Get processing logs showing opportunities created (published/draft) and rejections from processing_logs
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get filter parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const provider = searchParams.get('provider');
    const feedId = searchParams.get('feed_id');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Get log limit from settings
    const logMaxEntries = await settingsService.get('advanced.log_max_entries') || 100;

    const logs: LogEntry[] = [];

    // 1. Get published/draft opportunities (only if not filtering for rejected)
    if (!status || status === 'all' || status !== 'rejected') {
      let oppQuery = adminSupabase
        .from('opportunities')
        .select(`
          id,
          title,
          slug,
          opportunity_type,
          status,
          ai_provider,
          confidence_score,
          source_url,
          created_at,
          source_feed_id,
          rss_feeds!source_feed_id (
            id,
            name
          )
        `)
        .in('status', ['published', 'draft'])
        .order('created_at', { ascending: false })
        .limit(logMaxEntries);

      // Apply filters
      if (status && status !== 'all') {
        oppQuery = oppQuery.eq('status', status);
      }

      if (provider && provider !== 'all') {
        oppQuery = oppQuery.eq('ai_provider', provider);
      }

      if (feedId && feedId !== 'all') {
        oppQuery = oppQuery.eq('source_feed_id', feedId);
      }

      if (search) {
        oppQuery = oppQuery.ilike('title', `%${search}%`);
      }

      if (dateFrom) {
        oppQuery = oppQuery.gte('created_at', `${dateFrom}T00:00:00`);
      }

      if (dateTo) {
        oppQuery = oppQuery.lte('created_at', `${dateTo}T23:59:59`);
      }

      const { data: opportunities, error: oppError } = await oppQuery;

      if (oppError) {
        console.error('Error fetching opportunities:', oppError);
      } else {
        // Transform opportunities to log entries
        opportunities?.forEach((opp) => {
          logs.push({
            id: opp.id,
            date: opp.created_at,
            feed_name: opp.rss_feeds?.name || 'Unknown Feed',
            category: opp.opportunity_type,
            provider: opp.ai_provider || 'default',
            title: opp.title,
            status: opp.status as 'published' | 'draft',
            reason: opp.status === 'published' ? 'Published successfully' : 'Awaiting review',
            source_url: opp.source_url,
            opportunity_id: opp.status === 'published' ? opp.id : null,
            opportunity_slug: opp.status === 'published' ? opp.slug : null,
            confidence_score: opp.confidence_score,
          });
        });
      }
    }

    // 2. Get rejections from processing_logs (only if not filtering for published/draft)
    if (!status || status === 'all' || status === 'rejected') {
      let logQuery = adminSupabase
        .from('processing_logs')
        .select('*')
        .or('message.eq.Content rejected by AI,message.eq.Content rejected - below quality threshold')
        .order('created_at', { ascending: false })
        .limit(logMaxEntries);

      if (feedId && feedId !== 'all') {
        logQuery = logQuery.eq('feed_id', feedId);
      }

      if (dateFrom) {
        logQuery = logQuery.gte('created_at', `${dateFrom}T00:00:00`);
      }

      if (dateTo) {
        logQuery = logQuery.lte('created_at', `${dateTo}T23:59:59`);
      }

      const { data: rejectionLogs, error: logError } = await logQuery;

      if (logError) {
        console.error('Error fetching rejection logs:', logError);
      } else {
        // Transform rejection logs to log entries
        rejectionLogs?.forEach((log) => {
          const context = log.context || {};

          // Apply search filter
          if (search && !context.title?.toLowerCase().includes(search.toLowerCase())) {
            return;
          }

          // Apply provider filter
          if (provider && provider !== 'all' && context.ai_provider?.toLowerCase() !== provider.toLowerCase()) {
            return;
          }

          logs.push({
            id: log.id,
            date: log.created_at,
            feed_name: context.feed_name || 'Unknown Feed',
            category: context.opportunity_type || 'unknown',
            provider: context.ai_provider || 'default',
            title: context.title || 'Unknown Title',
            status: 'rejected',
            reason: context.reason || log.message || 'Content not suitable',
            source_url: context.source_url || '',
            opportunity_id: null,
            opportunity_slug: null,
            confidence_score: context.confidence_score || null,
          });
        });
      }
    }

    // Sort all logs by date (newest first) and limit
    logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const limitedLogs = logs.slice(0, logMaxEntries);

    return NextResponse.json({ logs: limitedLogs });
  } catch (error) {
    await logger.error('Error fetching processing logs', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
