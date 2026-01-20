import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { createServerClient } from '@/lib/utils/supabase-server';

/**
 * POST /api/admin/settings/cron
 *
 * Updates visitor-triggered cron settings
 */
export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { visitor_triggered_enabled, visitor_triggered_min_interval } = body;

        const adminClient = createAdminClient();
        const now = new Date().toISOString();

        // Update settings
        const settingsToUpdate = [
            {
                key: 'cron.visitor_triggered_enabled',
                value: visitor_triggered_enabled,
                updated_at: now,
            },
            {
                key: 'cron.visitor_triggered_min_interval',
                value: visitor_triggered_min_interval,
                updated_at: now,
            },
        ];

        for (const setting of settingsToUpdate) {
            const { error } = await adminClient
                .from('system_settings')
                .upsert(setting, { onConflict: 'key' });

            if (error) {
                console.error('Error saving cron setting:', error);
                return NextResponse.json(
                    { error: `Failed to save setting: ${setting.key}` },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Cron settings saved successfully',
        });
    } catch (error) {
        console.error('Error in cron settings API:', error);
        return NextResponse.json(
            { error: 'Failed to save cron settings' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/settings/cron
 *
 * Retrieves visitor-triggered cron settings
 */
export async function GET() {
    try {
        const adminClient = createAdminClient();

        const { data: settings } = await adminClient
            .from('system_settings')
            .select('key, value')
            .in('key', [
                'cron.visitor_triggered_enabled',
                'cron.visitor_triggered_min_interval',
                'cron.last_visitor_triggered_run'
            ]);

        const settingsMap = new Map(settings?.map(s => [s.key, s.value]) || []);

        return NextResponse.json({
            enabled: settingsMap.get('cron.visitor_triggered_enabled') !== false,
            min_interval_minutes: settingsMap.get('cron.visitor_triggered_min_interval') || 5,
            last_run: settingsMap.get('cron.last_visitor_triggered_run') || null,
        });
    } catch (error) {
        console.error('Error fetching cron settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch cron settings' },
            { status: 500 }
        );
    }
}
