// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

// GET - Get single page
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        const { data, error } = await adminSupabase
            .from('pages')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching page:', error);
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        return NextResponse.json({ page: data });
    } catch (error) {
        console.error('Get page error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT - Update page
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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
            sort_order,
            published_at,
            created_at
        } = body;

        // Check if slug is unique (excluding current page)
        if (slug) {
            const { data: existingPage } = await adminSupabase
                .from('pages')
                .select('id')
                .eq('slug', slug)
                .neq('id', id)
                .single();

            if (existingPage) {
                return NextResponse.json(
                    { error: 'A page with this slug already exists' },
                    { status: 400 }
                );
            }
        }

        // Get current page to check status change
        const { data: currentPage } = await adminSupabase
            .from('pages')
            .select('status, published_at')
            .eq('id', id)
            .single();

        // Build update data
        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (slug !== undefined) updateData.slug = slug;
        if (content !== undefined) updateData.content = content;
        if (featured_image_url !== undefined) updateData.featured_image_url = featured_image_url;
        if (meta_title !== undefined) updateData.meta_title = meta_title;
        if (meta_description !== undefined) updateData.meta_description = meta_description;
        if (status !== undefined) updateData.status = status;
        if (show_in_footer !== undefined) updateData.show_in_footer = show_in_footer;
        if (show_in_menu !== undefined) updateData.show_in_menu = show_in_menu;
        if (sort_order !== undefined) updateData.sort_order = sort_order;

        // Handle dates
        if (published_at !== undefined) {
            updateData.published_at = published_at || null;
        } else if (status === 'published' && currentPage?.status !== 'published' && !currentPage?.published_at) {
            // Auto-set published_at if publishing for the first time and no date provided
            updateData.published_at = new Date().toISOString();
        }

        if (created_at !== undefined && created_at) {
            updateData.created_at = created_at;
        }

        const { data, error } = await adminSupabase
            .from('pages')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating page:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ page: data });
    } catch (error) {
        console.error('Update page error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - Delete page
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        const { error } = await adminSupabase
            .from('pages')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting page:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete page error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
