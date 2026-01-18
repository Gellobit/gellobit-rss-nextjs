import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { createRouteClient } from '@/lib/utils/supabase-route';

/**
 * GET /api/opportunities
 * Protected API to get published opportunities
 * Requires authentication - opportunities are private content
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabaseAuth = await createRouteClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createAdminClient();

    let query = supabase
      .from('opportunities')
      .select('id, slug, title, excerpt, opportunity_type, deadline, prize_value, location, featured_image_url, published_at, created_at', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('opportunity_type', type);
    }

    const { data: opportunities, count, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      opportunities: opportunities || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}
