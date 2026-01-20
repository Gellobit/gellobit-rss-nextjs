// @ts-nocheck - Supabase type inference issues with Next.js 15 route client
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { opportunityService } from '@/lib/services/opportunity.service';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/admin/opportunities/[id]
 * Get single opportunity
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const supabase = await createRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const opportunity = await opportunityService.getById(resolvedParams.id);

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ opportunity }, { status: 200 });
  } catch (error) {
    await logger.error('Error fetching opportunity', {
      opportunity_id: resolvedParams.id,
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
 * Update opportunity (status, title, excerpt, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
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

    const body = await request.json();
    const {
      status,
      title,
      slug,
      excerpt,
      content,
      opportunity_type,
      deadline,
      prize_value,
      location,
      source_url,
      apply_url,
      featured_image_url,
      meta_title,
      meta_description,
      is_public,
    } = body;

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    if (status !== undefined) updateData.status = status;
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) updateData.content = content;
    if (opportunity_type !== undefined) updateData.opportunity_type = opportunity_type;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (prize_value !== undefined) updateData.prize_value = prize_value;
    if (location !== undefined) updateData.location = location;
    if (source_url !== undefined) updateData.source_url = source_url;
    if (apply_url !== undefined) updateData.apply_url = apply_url;
    if (featured_image_url !== undefined) updateData.featured_image_url = featured_image_url;
    if (meta_title !== undefined) updateData.meta_title = meta_title;
    if (meta_description !== undefined) updateData.meta_description = meta_description;
    if (is_public !== undefined) updateData.is_public = is_public;

    // Set published_at when publishing
    if (status === 'published') {
      const { data: existing } = await adminSupabase
        .from('opportunities')
        .select('published_at')
        .eq('id', resolvedParams.id)
        .single();

      if (!existing?.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await adminSupabase
      .from('opportunities')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await logger.info('Opportunity updated', {
      opportunity_id: resolvedParams.id,
      updated_fields: Object.keys(updateData),
      user_id: user.id,
    });

    return NextResponse.json(
      { message: 'Opportunity updated successfully', opportunity: data },
      { status: 200 }
    );
  } catch (error) {
    await logger.error('Error updating opportunity', {
      opportunity_id: resolvedParams.id,
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
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
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

    const result = await opportunityService.delete(resolvedParams.id);

    if (!result.success) {
      throw new Error(result.error);
    }

    return NextResponse.json(
      { message: 'Opportunity deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    await logger.error('Error deleting opportunity', {
      opportunity_id: resolvedParams.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
