// @ts-nocheck - Supabase type inference issues with Next.js 15 route client
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

/**
 * GET /api/admin/categories
 * List all categories with post counts
 */
export async function GET(request: NextRequest) {
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

        // Fetch categories ordered by display_order
        const { data: categories, error } = await adminSupabase
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error fetching categories:', error);
            return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
        }

        return NextResponse.json({ categories }, { status: 200 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/admin/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { name, slug, description, color, is_active } = body;

        if (!name || !slug) {
            return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
        }

        // Check if slug already exists
        const { data: existing } = await adminSupabase
            .from('categories')
            .select('id')
            .eq('slug', slug)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 400 });
        }

        // Get max display_order
        const { data: maxOrder } = await adminSupabase
            .from('categories')
            .select('display_order')
            .order('display_order', { ascending: false })
            .limit(1)
            .single();

        const nextOrder = (maxOrder?.display_order || 0) + 1;

        // Create category
        const { data: category, error } = await adminSupabase
            .from('categories')
            .insert({
                name,
                slug,
                description: description || null,
                color: color || '#FFDE59',
                is_active: is_active !== false,
                display_order: nextOrder,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating category:', error);
            return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
        }

        return NextResponse.json({ category }, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
