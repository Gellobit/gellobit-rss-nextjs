// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

export async function POST(request: NextRequest) {
    try {
        // Verify user is admin
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

        // Get form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const postId = formData.get('postId') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
        }

        // Validate file size (max 5MB for post images)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File must be less than 5MB' }, { status: 400 });
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
        const fileName = `post-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `posts/${fileName}`;

        // Convert File to ArrayBuffer then to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await adminSupabase.storage
            .from('images')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);

            // If bucket doesn't exist, create it
            if (uploadError.message?.includes('Bucket not found')) {
                const { error: createBucketError } = await adminSupabase.storage
                    .createBucket('images', { public: true });

                if (createBucketError) {
                    console.error('Failed to create bucket:', createBucketError);
                    return NextResponse.json(
                        { error: 'Storage bucket not available' },
                        { status: 500 }
                    );
                }

                // Retry upload
                const { error: retryError } = await adminSupabase.storage
                    .from('images')
                    .upload(filePath, buffer, {
                        contentType: file.type,
                        upsert: false,
                    });

                if (retryError) {
                    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
                }
            } else {
                return NextResponse.json({ error: uploadError.message }, { status: 500 });
            }
        }

        // Get public URL
        const { data: publicUrlData } = adminSupabase.storage
            .from('images')
            .getPublicUrl(filePath);

        const publicUrl = publicUrlData.publicUrl;

        // Track in media_files for cleanup when post is deleted
        const { data: mediaRecord, error: mediaError } = await adminSupabase
            .from('media_files')
            .insert({
                file_name: fileName,
                original_name: file.name,
                file_path: filePath,
                file_url: publicUrl,
                file_size: file.size,
                mime_type: file.type,
                bucket: 'images',
                entity_type: 'post',
                entity_id: postId || null
            })
            .select('id')
            .single();

        if (mediaError) {
            console.error('Error tracking media file:', mediaError);
            // Don't fail the upload, just log the error
        }

        return NextResponse.json({
            success: true,
            url: publicUrl,
            fileName,
            filePath,
            mediaId: mediaRecord?.id || null,
        });
    } catch (error) {
        console.error('Post image upload error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
