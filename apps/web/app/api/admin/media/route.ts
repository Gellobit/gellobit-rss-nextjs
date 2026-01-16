import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

// GET - List all media files
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
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search') || '';
        const offset = (page - 1) * limit;

        // Build query
        let query = adminSupabase
            .from('media_files')
            .select('id, file_name, original_name, file_path, file_url, file_size, mime_type, entity_type, created_at', { count: 'exact' })
            .order('created_at', { ascending: false });

        // Apply search filter
        if (search) {
            query = query.or(`original_name.ilike.%${search}%,file_name.ilike.%${search}%`);
        }

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        const { data: media, error, count } = await query;

        if (error) {
            console.error('Error fetching media:', error);
            return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
        }

        return NextResponse.json({
            media: media || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error in media GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Upload new media file
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

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
        }

        // Generate unique filename
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const fileName = `${timestamp}-${random}.${ext}`;
        const filePath = `media/${fileName}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage
        const { error: uploadError } = await adminSupabase.storage
            .from('images')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json({
                error: `Upload failed: ${uploadError.message}`,
                details: uploadError
            }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = adminSupabase.storage
            .from('images')
            .getPublicUrl(filePath);

        // Save to media_files table
        const { data: mediaRecord, error: dbError } = await adminSupabase
            .from('media_files')
            .insert({
                file_name: fileName,
                original_name: file.name,
                file_path: filePath,
                file_url: publicUrl,
                file_size: file.size,
                mime_type: file.type,
                bucket: 'images',
                entity_type: 'setting'  // Use 'setting' for general media uploads
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            // Try to delete uploaded file
            await adminSupabase.storage.from('images').remove([filePath]);
            return NextResponse.json({
                error: `Database error: ${dbError.message}`,
                code: dbError.code,
                details: dbError.details
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            media: mediaRecord
        });
    } catch (error) {
        console.error('Error in media POST:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
