import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/utils/supabase-server';
import { opportunityService } from '@/lib/services/opportunity.service';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/admin/opportunities/[id]
 * Get single opportunity
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const opportunity = await opportunityService.getById(params.id);

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ opportunity }, { status: 200 });
  } catch (error) {
    await logger.error('Error fetching opportunity', {
      opportunity_id: params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/opportunities/[id]
 * Update opportunity status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const result = await opportunityService.updateStatus(params.id, status);

    if (!result.success) {
      throw new Error(result.error);
    }

    return NextResponse.json(
      { message: 'Status updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    await logger.error('Error updating opportunity', {
      opportunity_id: params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/opportunities/[id]
 * Delete opportunity
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const result = await opportunityService.delete(params.id);

    if (!result.success) {
      throw new Error(result.error);
    }

    return NextResponse.json(
      { message: 'Opportunity deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    await logger.error('Error deleting opportunity', {
      opportunity_id: params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
