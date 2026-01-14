import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

// POST - Upload user avatar
export async function POST(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
        }

        // Validate file size (max 2MB for avatars)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: 'Image must be less than 2MB' }, { status: 400 });
        }

        const adminSupabase = createAdminClient();

        // Generate unique filename
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
        const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Delete old avatar if exists
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single();

        if (profile?.avatar_url) {
            // Extract old file path from URL
            const oldPath = profile.avatar_url.split('/').slice(-2).join('/');
            if (oldPath.startsWith('avatars/')) {
                await adminSupabase.storage.from('images').remove([oldPath]);
            }
        }

        // Upload new avatar
        const { error: uploadError } = await adminSupabase.storage
            .from('images')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
        }

        // Get public URL
        const { data: publicUrlData } = adminSupabase.storage
            .from('images')
            .getPublicUrl(filePath);

        const publicUrl = publicUrlData.publicUrl;

        // Update profile with new avatar URL
        const { error: updateError } = await adminSupabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', user.id);

        if (updateError) {
            console.error('Profile update error:', updateError);
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            url: publicUrl,
        });
    } catch (error) {
        console.error('Avatar upload error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - Remove user avatar
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminSupabase = createAdminClient();

        // Get current avatar
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single();

        if (profile?.avatar_url) {
            // Extract file path from URL
            const oldPath = profile.avatar_url.split('/').slice(-2).join('/');
            if (oldPath.startsWith('avatars/')) {
                await adminSupabase.storage.from('images').remove([oldPath]);
            }
        }

        // Clear avatar URL in profile
        await adminSupabase
            .from('profiles')
            .update({ avatar_url: null })
            .eq('id', user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Avatar delete error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
