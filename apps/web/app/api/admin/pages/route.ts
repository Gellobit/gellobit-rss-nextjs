// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

// GET - List all pages
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

        // Parse query params
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        // Build query
        let query = adminSupabase
            .from('pages')
            .select('*', { count: 'exact' })
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching pages:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            pages: data,
            total: count,
            limit,
            offset,
        });
    } catch (error) {
        console.error('Pages API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Create new page
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
        const {
            title,
            slug,
            content,
            featured_image_url,
            meta_title,
            meta_description,
            status,
            show_in_footer,
            show_in_menu,
            sort_order
        } = body;

        // Validate required fields
        if (!title || !slug || !content) {
            return NextResponse.json(
                { error: 'Title, slug, and content are required' },
                { status: 400 }
            );
        }

        // Check if slug is unique
        const { data: existingPage } = await adminSupabase
            .from('pages')
            .select('id')
            .eq('slug', slug)
            .single();

        if (existingPage) {
            return NextResponse.json(
                { error: 'A page with this slug already exists' },
                { status: 400 }
            );
        }

        // Create page
        const pageData: any = {
            title,
            slug,
            content,
            featured_image_url: featured_image_url || null,
            meta_title: meta_title || null,
            meta_description: meta_description || null,
            status: status || 'draft',
            show_in_footer: show_in_footer !== undefined ? show_in_footer : true,
            show_in_menu: show_in_menu !== undefined ? show_in_menu : true,
            sort_order: sort_order || 0,
            author_id: user.id,
        };

        // Set published_at if publishing
        if (status === 'published') {
            pageData.published_at = new Date().toISOString();
        }

        const { data, error } = await adminSupabase
            .from('pages')
            .insert(pageData)
            .select()
            .single();

        if (error) {
            console.error('Error creating page:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ page: data }, { status: 201 });
    } catch (error) {
        console.error('Create page error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
