// @ts-nocheck - Supabase type inference issues with Next.js 15 route client
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

/**
 * PUT /api/admin/categories/[id]
 * Update a category
 */
export async function PUT(
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
        const { name, slug, description, color, is_active } = body;

        // Build update object with only provided fields
        const updates: Record<string, any> = {};
        if (name !== undefined) updates.name = name;
        if (slug !== undefined) updates.slug = slug;
        if (description !== undefined) updates.description = description;
        if (color !== undefined) updates.color = color;
        if (is_active !== undefined) updates.is_active = is_active;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        // If slug is being updated, check for conflicts
        if (slug) {
            const { data: existing } = await adminSupabase
                .from('categories')
                .select('id')
                .eq('slug', slug)
                .neq('id', id)
                .single();

            if (existing) {
                return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 400 });
            }
        }

        // Update category
        const { data: category, error } = await adminSupabase
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating category:', error);
            return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
        }

        return NextResponse.json({ category }, { status: 200 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/categories/[id]
 * Delete a category (posts become uncategorized)
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

        // Check if this is the default category
        const { data: category } = await adminSupabase
            .from('categories')
            .select('is_default')
            .eq('id', id)
            .single();

        if (category?.is_default) {
            return NextResponse.json(
                { error: 'Cannot delete the default category. Set another category as default first.' },
                { status: 400 }
            );
        }

        // Delete category (posts will have category_id set to null due to ON DELETE SET NULL)
        const { error } = await adminSupabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting category:', error);
            return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
