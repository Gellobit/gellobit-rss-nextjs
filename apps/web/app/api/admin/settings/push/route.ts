import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { PushService } from '@/lib/services/push.service';

const PUSH_SETTINGS_KEYS = [
    'push.vapid_public_key',
    'push.vapid_private_key',
    'push.vapid_subject',
];

// GET - Fetch push settings
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

        // Fetch push settings
        const { data: settingsData } = await adminClient
            .from('system_settings')
            .select('key, value')
            .in('key', PUSH_SETTINGS_KEYS);

        const settingsMap: Record<string, string> = {};
        settingsData?.forEach(s => {
            const shortKey = s.key.replace('push.', '');
            const val = s.value;
            settingsMap[shortKey] = typeof val === 'string' ? val : (val ? String(val) : '');
        });

        // Mask private key for security
        const privateKey = settingsMap['vapid_private_key'];
        const settings = {
            vapid_public_key: settingsMap['vapid_public_key'] || '',
            vapid_private_key: privateKey && privateKey.length > 12
                ? privateKey.substring(0, 8) + '...' + privateKey.substring(privateKey.length - 4)
                : '',
            vapid_subject: settingsMap['vapid_subject'] || '',
            is_configured: !!(settingsMap['vapid_public_key'] && settingsMap['vapid_private_key']),
        };

        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Error in push settings GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Update push settings
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

        // Handle generate new keys request
        if (body.generate_keys) {
            const keys = PushService.generateVapidKeys();

            // Save the new keys
            const settingsToSave = [
                { key: 'push.vapid_public_key', value: keys.publicKey, category: 'push' },
                { key: 'push.vapid_private_key', value: keys.privateKey, category: 'push' },
            ];

            for (const setting of settingsToSave) {
                const { error } = await adminClient
                    .from('system_settings')
                    .upsert({
                        key: setting.key,
                        value: setting.value,
                        category: setting.category,
                    }, { onConflict: 'key' });

                if (error) {
                    console.error('Error saving setting:', setting.key, error);
                    return NextResponse.json({ error: `Failed to save ${setting.key}` }, { status: 500 });
                }
            }

            return NextResponse.json({
                success: true,
                publicKey: keys.publicKey,
            });
        }

        // Save regular settings
        const settingsToSave: { key: string; value: unknown; category: string }[] = [];

        // Only update private key if it's not masked
        if ('vapid_public_key' in body) {
            settingsToSave.push({
                key: 'push.vapid_public_key',
                value: body.vapid_public_key || '',
                category: 'push',
            });
        }
        if ('vapid_private_key' in body && !body.vapid_private_key?.includes('...')) {
            settingsToSave.push({
                key: 'push.vapid_private_key',
                value: body.vapid_private_key || '',
                category: 'push',
            });
        }
        if ('vapid_subject' in body) {
            settingsToSave.push({
                key: 'push.vapid_subject',
                value: body.vapid_subject || '',
                category: 'push',
            });
        }

        // Upsert each setting
        for (const setting of settingsToSave) {
            const { error } = await adminClient
                .from('system_settings')
                .upsert({
                    key: setting.key,
                    value: setting.value,
                    category: setting.category,
                }, { onConflict: 'key' });

            if (error) {
                console.error('Error saving setting:', setting.key, error);
                return NextResponse.json({ error: `Failed to save ${setting.key}` }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in push settings POST:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
