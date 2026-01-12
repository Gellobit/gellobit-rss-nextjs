// @ts-nocheck - Supabase type inference issues with Next.js 15 route client
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { opportunityService } from '@/lib/services/opportunity.service';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/admin/opportunities
 * List opportunities with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Use admin client to check role
    const adminSupabase = createAdminClient();
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || undefined;
    const opportunity_type = searchParams.get('type') || undefined;
    const feed_id = searchParams.get('feed_id') || undefined;

    const result = await opportunityService.list({
      page,
      limit,
      status: status as any,
      opportunity_type: opportunity_type as any,
      feed_id,
    });

    return NextResponse.json(result, { status: 200 });
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
