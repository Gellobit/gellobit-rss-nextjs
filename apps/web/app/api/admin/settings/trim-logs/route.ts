// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { settingsService } from '@/lib/services/settings.service';

/**
 * POST /api/admin/settings/trim-logs
 * Trim processing logs to the maximum entries limit
 */
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

        // Get max entries setting
        const maxEntries = await settingsService.get('advanced.log_max_entries') || 100;

        // Get the count of current logs
        const { count: totalCount } = await adminSupabase
            .from('processing_logs')
            .select('*', { count: 'exact', head: true });

        if (!totalCount || totalCount <= maxEntries) {
            return NextResponse.json({
                success: true,
                deleted: 0,
                message: `Log count (${totalCount || 0}) is within limit (${maxEntries})`
            });
        }

        // Get the ID of the log entry at the cutoff point (to keep the newest maxEntries)
        const { data: cutoffLog } = await adminSupabase
            .from('processing_logs')
            .select('created_at')
            .order('created_at', { ascending: false })
            .range(maxEntries - 1, maxEntries - 1)
            .single();

        if (!cutoffLog) {
            return NextResponse.json({
                success: true,
                deleted: 0,
                message: 'Could not determine cutoff point'
            });
        }

        // Delete logs older than the cutoff
        const { count: deletedCount, error } = await adminSupabase
            .from('processing_logs')
            .delete()
            .lt('created_at', cutoffLog.created_at);

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            deleted: deletedCount || 0,
            kept: maxEntries,
            message: `Trimmed ${deletedCount || 0} old log entries, keeping ${maxEntries} most recent`
        });
    } catch (error) {
        console.error('Error trimming logs:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
