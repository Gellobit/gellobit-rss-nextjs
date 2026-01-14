import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * DELETE /api/admin/cleanup/all
 * Delete all opportunities, processing logs, and related data
 * Requires admin authentication
 */
export async function DELETE(request: NextRequest) {
    try {
        // Verify admin authentication using cookies
        const cookieStore = await cookies();
        const supabaseAuth = createServerComponentClient({ cookies: () => cookieStore });
        const { data: { user } } = await supabaseAuth.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const supabase = createAdminClient();
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Delete all data in order (to respect foreign key constraints)
        const results: Record<string, { deleted: number; error?: string }> = {};

        // 1. Delete user_favorites (references opportunities)
        const { error: favError, count: favCount } = await supabase
            .from('user_favorites')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .select('id', { count: 'exact', head: true });
        results.user_favorites = { deleted: favCount || 0, error: favError?.message };

        // 2. Delete processing_logs
        const { error: logError, count: logCount } = await supabase
            .from('processing_logs')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .select('id', { count: 'exact', head: true });
        results.processing_logs = { deleted: logCount || 0, error: logError?.message };

        // 3. Delete processing_history
        const { error: histError, count: histCount } = await supabase
            .from('processing_history')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .select('id', { count: 'exact', head: true });
        results.processing_history = { deleted: histCount || 0, error: histError?.message };

        // 4. Delete duplicate_tracking
        const { error: dupError, count: dupCount } = await supabase
            .from('duplicate_tracking')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .select('id', { count: 'exact', head: true });
        results.duplicate_tracking = { deleted: dupCount || 0, error: dupError?.message };

        // 5. Delete media_files
        const { error: mediaError, count: mediaCount } = await supabase
            .from('media_files')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .select('id', { count: 'exact', head: true });
        results.media_files = { deleted: mediaCount || 0, error: mediaError?.message };

        // 6. Delete opportunities
        const { error: oppError, count: oppCount } = await supabase
            .from('opportunities')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .select('id', { count: 'exact', head: true });
        results.opportunities = { deleted: oppCount || 0, error: oppError?.message };

        // 7. Delete analytics
        const { error: analyticsError, count: analyticsCount } = await supabase
            .from('analytics')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .select('id', { count: 'exact', head: true });
        results.analytics = { deleted: analyticsCount || 0, error: analyticsError?.message };

        return NextResponse.json({
            success: true,
            message: 'All opportunities and logs have been deleted',
            results,
        });
    } catch (error) {
        console.error('Cleanup all error:', error);
        return NextResponse.json(
            { error: 'Cleanup failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
