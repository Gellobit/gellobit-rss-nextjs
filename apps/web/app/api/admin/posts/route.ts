// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

// GET - List all posts
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
        const sortBy = searchParams.get('sortBy') || 'created_at';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Validate sortBy to prevent SQL injection
        const allowedSortFields = ['title', 'created_at', 'published_at', 'status'];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
        const ascending = sortOrder === 'asc';

        // Build query
        let query = adminSupabase
            .from('posts')
            .select('*', { count: 'exact' })
            .order(safeSortBy, { ascending })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching posts:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            posts: data,
            total: count,
            limit,
            offset,
        });
    } catch (error) {
        console.error('Posts API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Create new post
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
        const { title, slug, excerpt, content, featured_image_url, meta_title, meta_description, status, category_id } = body;

        // Validate required fields
        if (!title || !slug || !content) {
            return NextResponse.json(
                { error: 'Title, slug, and content are required' },
                { status: 400 }
            );
        }

        // Check if slug is unique
        const { data: existingPost } = await adminSupabase
            .from('posts')
            .select('id')
            .eq('slug', slug)
            .single();

        if (existingPost) {
            return NextResponse.json(
                { error: 'A post with this slug already exists' },
                { status: 400 }
            );
        }

        // Create post
        const postData: any = {
            title,
            slug,
            excerpt: excerpt || null,
            content,
            featured_image_url: featured_image_url || null,
            meta_title: meta_title || null,
            meta_description: meta_description || null,
            status: status || 'draft',
            category_id: category_id || null,
            author_id: user.id,
        };

        // Set published_at if publishing
        if (status === 'published') {
            postData.published_at = new Date().toISOString();
        }

        const { data, error } = await adminSupabase
            .from('posts')
            .insert(postData)
            .select()
            .single();

        if (error) {
            console.error('Error creating post:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ post: data }, { status: 201 });
    } catch (error) {
        console.error('Create post error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
