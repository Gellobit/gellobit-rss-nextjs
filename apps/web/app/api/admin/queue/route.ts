// @ts-nocheck - Supabase type inference issues with Next.js 15 route client
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/admin/queue
 * Get queue status and pending items
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteClient();
    const adminSupabase = createAdminClient();

    // Verify user is authenticated and admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
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

    // Get queue stats
    const { data: queueStats, error: statsError } = await adminSupabase
      .from('feed_processing_queue')
      .select('status', { count: 'exact' });

    if (statsError) {
      throw statsError;
    }

    // Count by status
    const { data: pendingCount } = await adminSupabase
      .from('feed_processing_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { data: processingCount } = await adminSupabase
      .from('feed_processing_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'processing');

    const { data: completedCount } = await adminSupabase
      .from('feed_processing_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    const { data: failedCount } = await adminSupabase
      .from('feed_processing_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed');

    // Get recent pending items
    const { data: pendingItems } = await adminSupabase
      .from('feed_processing_queue')
      .select(`
        id,
        item_url,
        item_title,
        status,
        attempts,
        created_at,
        rss_feeds!inner(name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    return NextResponse.json({
      stats: {
        pending: pendingCount,
        processing: processingCount,
        completed: completedCount,
        failed: failedCount,
      },
      pending_items: pendingItems || [],
    }, { status: 200 });
  } catch (error) {
    await logger.error('Error fetching queue status', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/queue
 * Manually trigger queue processing (calls Edge Function)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteClient();

    // Verify user is authenticated and admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
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

    const body = await request.json().catch(() => ({}));
    const action = body.action || 'process-queue'; // 'fetch-rss' or 'process-queue'

    // Get Supabase Edge Function URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    // Determine which Edge Function to call
    const functionName = action === 'fetch-rss' ? 'fetch-rss' : 'process-queue-item';
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/${functionName}`;

    // Call the Edge Function
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({}),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      await logger.error('Edge function call failed', {
        function: functionName,
        status: response.status,
        result,
      });
      return NextResponse.json(
        { error: result.error || 'Edge function call failed', details: result },
        { status: response.status }
      );
    }

    await logger.info('Manual queue trigger executed', {
      action,
      user_id: user.id,
      result,
    });

    return NextResponse.json({
      success: true,
      action,
      result,
    }, { status: 200 });
  } catch (error) {
    await logger.error('Error triggering queue processing', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/queue
 * Clear completed/failed items from queue
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteClient();
    const adminSupabase = createAdminClient();

    // Verify user is authenticated and admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'completed'; // 'completed', 'failed', or 'all'

    let query = adminSupabase.from('feed_processing_queue').delete();

    if (status === 'all') {
      query = query.in('status', ['completed', 'failed', 'duplicate']);
    } else {
      query = query.eq('status', status);
    }

    const { error, count } = await query.select('*', { count: 'exact', head: true });

    // Actually delete
    let deleteQuery = adminSupabase.from('feed_processing_queue').delete();
    if (status === 'all') {
      deleteQuery = deleteQuery.in('status', ['completed', 'failed', 'duplicate']);
    } else {
      deleteQuery = deleteQuery.eq('status', status);
    }
    await deleteQuery;

    await logger.info('Queue items cleared', {
      status,
      user_id: user.id,
    });

    return NextResponse.json({
      success: true,
      status_cleared: status,
    }, { status: 200 });
  } catch (error) {
    await logger.error('Error clearing queue', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
