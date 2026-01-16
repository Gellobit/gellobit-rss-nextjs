import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

// POST - Subscribe to push notifications
export async function POST(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { subscription, deviceName } = body;

        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return NextResponse.json(
                { error: 'Invalid subscription data' },
                { status: 400 }
            );
        }

        const adminClient = createAdminClient();

        // Upsert subscription (update if same endpoint exists)
        const { error } = await adminClient
            .from('push_subscriptions')
            .upsert({
                user_id: user.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                user_agent: request.headers.get('user-agent') || null,
                device_name: deviceName || null,
                last_used_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,endpoint',
            });

        if (error) {
            console.error('Error saving push subscription:', error);
            return NextResponse.json(
                { error: 'Failed to save subscription' },
                { status: 500 }
            );
        }

        // Also update user's notification settings to enable push
        await adminClient
            .from('user_notification_settings')
            .update({ push_enabled: true })
            .eq('user_id', user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in push subscription POST:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const endpoint = searchParams.get('endpoint');

        const adminClient = createAdminClient();

        if (endpoint) {
            // Delete specific subscription
            await adminClient
                .from('push_subscriptions')
                .delete()
                .eq('user_id', user.id)
                .eq('endpoint', endpoint);
        } else {
            // Delete all subscriptions for user
            await adminClient
                .from('push_subscriptions')
                .delete()
                .eq('user_id', user.id);
        }

        // Check if user has any remaining subscriptions
        const { data: remaining } = await adminClient
            .from('push_subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

        // If no subscriptions left, disable push in settings
        if (!remaining || remaining.length === 0) {
            await adminClient
                .from('user_notification_settings')
                .update({ push_enabled: false })
                .eq('user_id', user.id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in push subscription DELETE:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET - Get user's push subscriptions
export async function GET(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminClient = createAdminClient();

        const { data: subscriptions } = await adminClient
            .from('push_subscriptions')
            .select('id, endpoint, device_name, user_agent, created_at, last_used_at')
            .eq('user_id', user.id)
            .order('last_used_at', { ascending: false });

        return NextResponse.json({ subscriptions: subscriptions || [] });
    } catch (error) {
        console.error('Error in push subscription GET:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
