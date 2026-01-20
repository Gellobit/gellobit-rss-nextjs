import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

// Default membership settings
const DEFAULT_SETTINGS = {
    system_enabled: true,
    free_content_percentage: 60,
    free_delay_hours: 24,
    free_favorites_limit: 5,
    show_locked_content: true,
    locked_content_blur: true,
    monthly_price: 4.99,
    annual_price: 39.99,
    paypal_enabled: false,
    paypal_client_id: '',
    paypal_plan_id_monthly: '',
    paypal_plan_id_annual: '',
    stripe_enabled: false,
    free_notifications_daily: 1,
    free_email_digest: 'weekly',
};

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

        // Fetch membership settings from database
        const { data: settingsData, error } = await adminSupabase
            .from('system_settings')
            .select('key, value')
            .eq('category', 'membership');

        if (error) {
            console.error('Error fetching membership settings:', error);
            return NextResponse.json({ settings: DEFAULT_SETTINGS });
        }

        // Parse settings
        const settings: Record<string, any> = { ...DEFAULT_SETTINGS };
        for (const row of settingsData || []) {
            const shortKey = row.key.replace('membership.', '');
            let value = row.value;

            // Parse JSON values
            if (typeof value === 'string') {
                try {
                    value = JSON.parse(value);
                } catch {
                    // Keep as string if not valid JSON
                }
            }

            settings[shortKey] = value;
        }

        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Error fetching membership settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

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

        const body = await request.json();

        // Save each setting to database
        for (const [key, value] of Object.entries(body)) {
            const fullKey = `membership.${key}`;

            // Determine the value to store
            const storedValue = typeof value === 'string' ? value : JSON.stringify(value);

            const { error } = await adminSupabase
                .from('system_settings')
                .upsert({
                    key: fullKey,
                    value: storedValue,
                    category: 'membership',
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'key'
                });

            if (error) {
                console.error(`Error saving ${fullKey}:`, error);
                return NextResponse.json(
                    { error: `Failed to save setting: ${key}` },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({ success: true, settings: body });
    } catch (error) {
        console.error('Error saving membership settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
