// @ts-nocheck - Supabase type inference issues with Next.js 15 route client
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

/**
 * POST /api/admin/categories/[id]/default
 * Set a category as the default
 */
export async function POST(
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

        // Check if category exists and is active
        const { data: category } = await adminSupabase
            .from('categories')
            .select('id, is_active')
            .eq('id', id)
            .single();

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        if (!category.is_active) {
            return NextResponse.json(
                { error: 'Cannot set an inactive category as default' },
                { status: 400 }
            );
        }

        // Remove default from all categories first
        await adminSupabase
            .from('categories')
            .update({ is_default: false })
            .eq('is_default', true);

        // Set this category as default
        const { error } = await adminSupabase
            .from('categories')
            .update({ is_default: true })
            .eq('id', id);

        if (error) {
            console.error('Error setting default category:', error);
            return NextResponse.json({ error: 'Failed to set default category' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
