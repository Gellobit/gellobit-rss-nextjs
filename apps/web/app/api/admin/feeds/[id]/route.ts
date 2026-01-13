import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { logger } from '@/lib/utils/logger';
import { safeParse, updateFeedSchema } from '@/lib/utils/validation';

/**
 * GET /api/admin/feeds/[id]
 * Get single RSS feed
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
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
      .eq('id', user.id as string)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminSupabase = createAdminClient();
    const { data: feed, error } = await adminSupabase
      .from('rss_feeds')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (error || !feed) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    }

    return NextResponse.json({ feed }, { status: 200 });
  } catch (error) {
    await logger.error('Error fetching feed', {
      feed_id: resolvedParams.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/feeds/[id]
 * Update RSS feed
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
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
      .eq('id', user.id as string)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = safeParse(body, updateFeedSchema);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      );
    }

    // Remove ai_api_key - this column doesn't exist in the database
    const { ai_api_key, ...updateData } = validation.data;

    const adminSupabase = createAdminClient();
    const { data: feed, error } = await adminSupabase
      .from('rss_feeds')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await logger.info('RSS feed updated', {
      feed_id: resolvedParams.id,
      user_id: user.id,
    });

    return NextResponse.json({ feed }, { status: 200 });
  } catch (error) {
    await logger.error('Error updating feed', {
      feed_id: resolvedParams.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/feeds/[id]
 * Delete RSS feed
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
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
      .eq('id', user.id as string)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('rss_feeds')
      .delete()
      .eq('id', resolvedParams.id);

    if (error) {
      throw error;
    }

    await logger.info('RSS feed deleted', {
      feed_id: resolvedParams.id,
      user_id: user.id,
    });

    return NextResponse.json(
      { message: 'Feed deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    await logger.error('Error deleting feed', {
      feed_id: resolvedParams.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
