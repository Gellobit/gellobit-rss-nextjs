// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

// GET - Get single post
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
            .from('posts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching post:', error);
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        return NextResponse.json({ post: data });
    } catch (error) {
        console.error('Get post error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT - Update post
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
        const { title, slug, excerpt, content, featured_image_url, meta_title, meta_description, status, category_id, published_at, created_at } = body;

        // Check if slug is unique (excluding current post)
        if (slug) {
            const { data: existingPost } = await adminSupabase
                .from('posts')
                .select('id')
                .eq('slug', slug)
                .neq('id', id)
                .single();

            if (existingPost) {
                return NextResponse.json(
                    { error: 'A post with this slug already exists' },
                    { status: 400 }
                );
            }
        }

        // Get current post to check status change
        const { data: currentPost } = await adminSupabase
            .from('posts')
            .select('status, published_at')
            .eq('id', id)
            .single();

        // Build update data
        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (slug !== undefined) updateData.slug = slug;
        if (excerpt !== undefined) updateData.excerpt = excerpt;
        if (content !== undefined) updateData.content = content;
        if (featured_image_url !== undefined) updateData.featured_image_url = featured_image_url;
        if (meta_title !== undefined) updateData.meta_title = meta_title;
        if (meta_description !== undefined) updateData.meta_description = meta_description;
        if (status !== undefined) updateData.status = status;
        if (category_id !== undefined) updateData.category_id = category_id || null;

        // Handle dates
        if (published_at !== undefined) {
            updateData.published_at = published_at || null;
        } else if (status === 'published' && currentPost?.status !== 'published' && !currentPost?.published_at) {
            // Auto-set published_at if publishing for the first time and no date provided
            updateData.published_at = new Date().toISOString();
        }

        if (created_at !== undefined && created_at) {
            updateData.created_at = created_at;
        }

        const { data, error } = await adminSupabase
            .from('posts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating post:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ post: data });
    } catch (error) {
        console.error('Update post error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - Delete post
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

        // Get the post data BEFORE deleting (to get featured_image_url)
        const { data: post } = await adminSupabase
            .from('posts')
            .select('featured_image_url')
            .eq('id', id)
            .single();

        // Get associated media files BEFORE deleting post (trigger will delete records)
        const { data: mediaFiles } = await adminSupabase
            .from('media_files')
            .select('file_path')
            .eq('entity_type', 'post')
            .eq('entity_id', id);

        // Delete post (trigger will clean up media_files records)
        const { error } = await adminSupabase
            .from('posts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting post:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Collect all file paths to delete
        const filePaths: string[] = mediaFiles?.map(f => f.file_path) || [];

        // Also handle featured image if it's stored in our bucket
        if (post?.featured_image_url) {
            // Check if the featured image is in our Supabase storage
            const supabaseStoragePattern = /\/storage\/v1\/object\/public\/images\/(.+)$/;
            const match = post.featured_image_url.match(supabaseStoragePattern);

            if (match) {
                const featuredImagePath = match[1];
                // Only add if not already in the list
                if (!filePaths.includes(featuredImagePath)) {
                    filePaths.push(featuredImagePath);
                }

                // Also delete from media_files table (it might be stored with different entity_type)
                await adminSupabase
                    .from('media_files')
                    .delete()
                    .eq('file_url', post.featured_image_url);
            }
        }

        // Delete actual files from Supabase Storage
        if (filePaths.length > 0) {
            const { error: storageError } = await adminSupabase.storage
                .from('images')
                .remove(filePaths);

            if (storageError) {
                console.error('Error deleting media files from storage:', storageError);
                // Don't fail the request, post is already deleted
            } else {
                console.log(`Deleted ${filePaths.length} media files from storage`);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete post error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
