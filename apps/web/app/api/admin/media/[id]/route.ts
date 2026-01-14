import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

// DELETE - Delete a media file
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

        // Get media record
        const { data: mediaRecord, error: fetchError } = await adminSupabase
            .from('media_files')
            .select('id, file_path, bucket')
            .eq('id', id)
            .single();

        if (fetchError || !mediaRecord) {
            return NextResponse.json({ error: 'Media not found' }, { status: 404 });
        }

        // Delete from storage
        const { error: storageError } = await adminSupabase.storage
            .from(mediaRecord.bucket || 'images')
            .remove([mediaRecord.file_path]);

        if (storageError) {
            console.error('Storage delete error:', storageError);
            // Continue to delete database record even if storage delete fails
        }

        // Delete from database
        const { error: dbError } = await adminSupabase
            .from('media_files')
            .delete()
            .eq('id', id);

        if (dbError) {
            console.error('Database delete error:', dbError);
            return NextResponse.json({ error: 'Failed to delete media record' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in media DELETE:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
