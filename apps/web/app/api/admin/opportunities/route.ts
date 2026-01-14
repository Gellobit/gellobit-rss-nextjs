// @ts-nocheck - Supabase type inference issues with Next.js 15 route client
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/admin/opportunities
 * List opportunities with pagination, filters, and stats
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

    // Use admin client to check role and query data
    const adminSupabase = createAdminClient();

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || undefined;
    const opportunity_type = searchParams.get('opportunity_type') || undefined;
    const feed_id = searchParams.get('feed_id') || undefined;
    const search = searchParams.get('search') || undefined;

    // Build query
    let query = adminSupabase
      .from('opportunities')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        opportunity_type,
        status,
        source_url,
        source_feed_id,
        confidence_score,
        featured_image_url,
        rejection_reason,
        ai_provider,
        created_at,
        deadline,
        prize_value,
        location,
        rss_feeds!source_feed_id (
          id,
          name
        )
      `, { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (opportunity_type) {
      query = query.eq('opportunity_type', opportunity_type);
    }
    if (feed_id) {
      query = query.eq('source_feed_id', feed_id);
    }
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Apply pagination and ordering
    const { data: opportunities, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching opportunities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch opportunities', details: error.message },
        { status: 500 }
      );
    }

    // Get stats (total counts by status)
    const { count: totalCount } = await adminSupabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true });

    const { count: publishedCount } = await adminSupabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    const { count: draftCount } = await adminSupabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft');

    const { count: rejectedCount } = await adminSupabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected');

    // Transform data to include feed name
    const transformedOpportunities = opportunities?.map((opp) => ({
      ...opp,
      feed_name: opp.rss_feeds?.name || 'Unknown Feed',
    })) || [];

    return NextResponse.json({
      opportunities: transformedOpportunities,
      total: count || 0,
      stats: {
        total: totalCount || 0,
        published: publishedCount || 0,
        draft: draftCount || 0,
        rejected: rejectedCount || 0,
      }
    });
  } catch (error) {
    await logger.error('Error fetching opportunities', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/opportunities
 * Bulk delete opportunities by status
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get status to delete
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    if (!status) {
      return NextResponse.json(
        { error: 'Status parameter is required for bulk delete' },
        { status: 400 }
      );
    }

    // Delete opportunities with the given status
    const { data, error } = await adminSupabase
      .from('opportunities')
      .delete()
      .eq('status', status)
      .select('id');

    if (error) {
      throw error;
    }

    await logger.info('Bulk deleted opportunities', {
      status,
      count: data?.length || 0,
      user_id: user.id,
    });

    return NextResponse.json({
      success: true,
      deleted: data?.length || 0,
    });
  } catch (error) {
    await logger.error('Error bulk deleting opportunities', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
