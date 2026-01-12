import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/utils/supabase-server';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/admin/logs
 * Get processing logs with pagination and filters
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const level = searchParams.get('level');
    const feedId = searchParams.get('feed_id');

    const adminSupabase = createAdminClient();
    let query = adminSupabase
      .from('processing_logs')
      .select('*', { count: 'exact' });

    if (level) {
      query = query.eq('level', level);
    }

    if (feedId) {
      query = query.eq('feed_id', feedId);
    }

    const { data: logs, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        logs: logs || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
      { status: 200 }
    );
  } catch (error) {
    await logger.error('Error fetching logs', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
