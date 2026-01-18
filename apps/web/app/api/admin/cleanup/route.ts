import { NextRequest, NextResponse } from 'next/server';
import { cleanupService } from '@/lib/services/cleanup.service';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

/**
 * POST /api/admin/cleanup
 * Run cleanup of expired opportunities
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication using cookie-based session
    const supabase = await createRouteClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Run cleanup
    const result = await cleanupService.cleanupExpiredOpportunities();

    return NextResponse.json({
      success: result.success,
      deleted_count: result.deletedCount,
      deleted_by_type: result.deletedByType,
      skipped_evergreen: result.skippedEvergreen,
      errors: result.errors,
      message: `Cleanup completed. Deleted ${result.deletedCount} expired opportunities. Skipped ${result.skippedEvergreen} evergreen items.`,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/cleanup
 * Get expiration statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication using cookie-based session
    const supabase = await createRouteClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get stats
    const stats = await cleanupService.getExpirationStats();

    return NextResponse.json({
      stats,
      message: 'Expiration statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
