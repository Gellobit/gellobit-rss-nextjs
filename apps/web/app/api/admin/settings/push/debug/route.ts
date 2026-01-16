import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { pushService } from '@/lib/services/push.service';

// GET - Debug push notification setup
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

        // Get all push subscriptions
        const { data: subscriptions, error: subError } = await adminClient
            .from('push_subscriptions')
            .select('id, user_id, endpoint, device_name, created_at, last_used_at');

        // Get VAPID config status
        const isConfigured = await pushService.isConfigured();
        const publicKey = await pushService.getPublicKey();

        // Get push settings from DB
        const { data: pushSettings } = await adminClient
            .from('system_settings')
            .select('key, value')
            .like('key', 'push.%');

        return NextResponse.json({
            push_configured: isConfigured,
            public_key_exists: !!publicKey,
            public_key_preview: publicKey ? publicKey.substring(0, 30) + '...' : null,
            subscriptions_count: subscriptions?.length || 0,
            subscriptions: subscriptions?.map(s => ({
                id: s.id,
                user_id: s.user_id,
                endpoint_preview: s.endpoint.substring(0, 60) + '...',
                device_name: s.device_name,
                created_at: s.created_at,
            })),
            settings_in_db: pushSettings?.map(s => ({
                key: s.key,
                has_value: !!s.value,
            })),
            current_user_id: user.id,
            subscription_error: subError?.message,
        });
    } catch (error) {
        console.error('Debug error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
