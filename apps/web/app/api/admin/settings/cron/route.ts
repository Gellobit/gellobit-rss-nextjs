import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { createRouteClient } from '@/lib/utils/supabase-route';

/**
 * POST /api/admin/settings/cron
 *
 * Updates visitor-triggered cron settings
 */
export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin role
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { visitor_triggered_enabled, visitor_triggered_min_interval } = body;

        // Update settings - stringify non-string values for storage
        const settingsToUpdate = [
            {
                key: 'cron.visitor_triggered_enabled',
                value: JSON.stringify(visitor_triggered_enabled),
                category: 'advanced',
            },
            {
                key: 'cron.visitor_triggered_min_interval',
                value: JSON.stringify(visitor_triggered_min_interval),
                category: 'advanced',
            },
        ];

        for (const setting of settingsToUpdate) {
            const { error } = await adminClient
                .from('system_settings')
                .upsert({
                    key: setting.key,
                    value: setting.value,
                    category: setting.category,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'key' });

            if (error) {
                console.error('Error saving cron setting:', setting.key, error);
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

        // Parse settings with JSON.parse for stored values
        const settingsMap: Record<string, any> = {};
        for (const row of settings || []) {
            let value = row.value;
            // Parse JSON values
            if (typeof value === 'string') {
                try {
                    value = JSON.parse(value);
                } catch {
                    // Keep as string if not valid JSON
                }
            }
            settingsMap[row.key] = value;
        }

        // Default to enabled=true if not set
        const enabled = settingsMap['cron.visitor_triggered_enabled'];
        const minInterval = settingsMap['cron.visitor_triggered_min_interval'];

        return NextResponse.json({
            enabled: enabled !== undefined ? enabled : true,
            min_interval_minutes: minInterval !== undefined ? minInterval : 5,
            last_run: settingsMap['cron.last_visitor_triggered_run'] || null,
        });
    } catch (error) {
        console.error('Error fetching cron settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch cron settings' },
            { status: 500 }
        );
    }
}
