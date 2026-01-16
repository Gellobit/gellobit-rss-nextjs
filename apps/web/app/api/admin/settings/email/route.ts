import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

const EMAIL_SETTINGS_KEYS = [
    'email.resend_api_key',
    'email.from_email',
    'email.from_name',
    'email.reply_to',
];

// GET - Fetch email settings
export async function GET(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if admin
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch email settings directly
        const { data: settingsData } = await adminClient
            .from('system_settings')
            .select('key, value')
            .in('key', EMAIL_SETTINGS_KEYS);

        const settingsMap: Record<string, string> = {};
        settingsData?.forEach(s => {
            const shortKey = s.key.replace('email.', '');
            // value is JSONB, handle string conversion
            const val = s.value;
            settingsMap[shortKey] = typeof val === 'string' ? val : (val ? String(val) : '');
        });

        // Mask API key for security
        const apiKey = settingsMap['resend_api_key'];
        const settings = {
            resend_api_key: apiKey && apiKey.length > 12
                ? apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4)
                : '',
            from_email: settingsMap['from_email'] || '',
            from_name: settingsMap['from_name'] || '',
            reply_to: settingsMap['reply_to'] || '',
        };

        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Error in email settings GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Update email settings
export async function POST(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if admin
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();

        // Save each setting using upsert
        // Note: value column is JSONB, so we need to wrap strings in JSON
        const settingsToSave: { key: string; value: unknown; category: string }[] = [];

        // Only update API key if it's not masked
        if ('resend_api_key' in body && !body.resend_api_key?.includes('...')) {
            settingsToSave.push({
                key: 'email.resend_api_key',
                value: body.resend_api_key || '',
                category: 'email',
            });
        }
        if ('from_email' in body) {
            settingsToSave.push({
                key: 'email.from_email',
                value: body.from_email || '',
                category: 'email',
            });
        }
        if ('from_name' in body) {
            settingsToSave.push({
                key: 'email.from_name',
                value: body.from_name || '',
                category: 'email',
            });
        }
        if ('reply_to' in body) {
            settingsToSave.push({
                key: 'email.reply_to',
                value: body.reply_to || '',
                category: 'email',
            });
        }

        // Upsert each setting
        for (const setting of settingsToSave) {
            const { error } = await adminClient
                .from('system_settings')
                .upsert({
                    key: setting.key,
                    value: setting.value, // Supabase JS client handles JSONB conversion
                    category: setting.category,
                }, { onConflict: 'key' });

            if (error) {
                console.error('Error saving setting:', setting.key, error);
                return NextResponse.json({ error: `Failed to save ${setting.key}` }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in email settings POST:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
