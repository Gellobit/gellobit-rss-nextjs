// @ts-nocheck - Supabase type inference issues with Next.js 15 route client
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { opportunityTypesService } from '@/lib/services/opportunity-types.service';

/**
 * GET /api/admin/opportunity-types/[id]
 * Get a single opportunity type
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

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

        const { id } = await params;
        const type = await opportunityTypesService.getById(id);

        if (!type) {
            return NextResponse.json({ error: 'Opportunity type not found' }, { status: 404 });
        }

        return NextResponse.json({ type }, { status: 200 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/opportunity-types/[id]
 * Update an opportunity type
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

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

        const { id } = await params;
        const body = await request.json();

        // Only allow updating specific fields
        const allowedFields = ['name', 'description', 'color', 'icon', 'is_active', 'display_order'];
        const updateData: Record<string, any> = {};

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const type = await opportunityTypesService.update(id, updateData);

        if (!type) {
            return NextResponse.json({ error: 'Opportunity type not found' }, { status: 404 });
        }

        return NextResponse.json({ type }, { status: 200 });
    } catch (error: any) {
        console.error('Error updating opportunity type:', error);
        return NextResponse.json({
            error: error.message || 'Failed to update opportunity type'
        }, { status: 400 });
    }
}

/**
 * DELETE /api/admin/opportunity-types/[id]
 * Delete an opportunity type
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

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

        const { id } = await params;

        await opportunityTypesService.delete(id);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error('Error deleting opportunity type:', error);
        return NextResponse.json({
            error: error.message || 'Failed to delete opportunity type'
        }, { status: 400 });
    }
}
