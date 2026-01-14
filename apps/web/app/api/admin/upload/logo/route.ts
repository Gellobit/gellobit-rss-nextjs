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

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: 'File must be less than 2MB' }, { status: 400 });
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const filePath = `branding/${fileName}`;

        // Convert File to ArrayBuffer then to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await adminSupabase.storage
            .from('images')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);

            // If bucket doesn't exist, create it
            if (uploadError.message?.includes('Bucket not found')) {
                // Try to create the bucket
                const { error: createBucketError } = await adminSupabase.storage
                    .createBucket('images', { public: true });

                if (createBucketError) {
                    console.error('Failed to create bucket:', createBucketError);
                    return NextResponse.json(
                        { error: 'Storage bucket not available. Please create "images" bucket in Supabase.' },
                        { status: 500 }
                    );
                }

                // Retry upload
                const { data: retryData, error: retryError } = await adminSupabase.storage
                    .from('images')
                    .upload(filePath, buffer, {
                        contentType: file.type,
                        upsert: true,
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

        // Save to media_files table
        const { error: dbError } = await adminSupabase
            .from('media_files')
            .insert({
                file_name: fileName,
                original_name: file.name,
                file_path: filePath,
                file_url: publicUrl,
                file_size: file.size,
                mime_type: file.type,
                bucket: 'images',
                entity_type: 'setting',
                entity_id: null, // Logo is a global setting
            });

        if (dbError) {
            console.error('Database error:', dbError);
            // Don't fail the upload if we can't save to media_files
        }

        return NextResponse.json({
            success: true,
            url: publicUrl,
            fileName,
            filePath,
        });
    } catch (error) {
        console.error('Logo upload error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
