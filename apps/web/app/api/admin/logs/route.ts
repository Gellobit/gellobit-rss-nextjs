// @ts-nocheck - Supabase type inference issues with Next.js 15 route client
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/admin/logs
 * Get processing logs showing opportunities created (published/rejected/draft)
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

    // Build query from opportunities table
    let query = adminSupabase
      .from('opportunities')
      .select(`
        id,
        title,
        opportunity_type,
        status,
        ai_provider,
        confidence_score,
        source_url,
        created_at,
        rejection_reason,
        source_feed_id,
        rss_feeds!source_feed_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (provider && provider !== 'all') {
      query = query.eq('ai_provider', provider);
    }

    if (feedId && feedId !== 'all') {
      query = query.eq('source_feed_id', feedId);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: opportunities, error } = await query;

    if (error) {
      console.error('Error fetching logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch logs', details: error.message },
        { status: 500 }
      );
    }

    // Transform data to match frontend interface
    const logs = opportunities?.map((opp) => ({
      id: opp.id,
      date: opp.created_at,
      feed_name: opp.rss_feeds?.name || 'Unknown Feed',
      category: opp.opportunity_type,
      provider: opp.ai_provider || 'default',
      title: opp.title,
      status: opp.status,
      reason: opp.rejection_reason ||
             (opp.status === 'published' ? 'Published successfully' :
              opp.status === 'draft' ? 'Awaiting review' : 'No reason provided'),
      source_url: opp.source_url,
      opportunity_id: opp.status === 'published' ? opp.id : null,
      confidence_score: opp.confidence_score,
    })) || [];

    return NextResponse.json({ logs });
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
