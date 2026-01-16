import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { pushService } from '@/lib/services/push.service';

// POST - Send test push notification to admin
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

        // Check if push is configured
        const isConfigured = await pushService.isConfigured();
        if (!isConfigured) {
            return NextResponse.json({
                error: 'Push notifications not configured. Please generate or enter VAPID keys first.',
            }, { status: 400 });
        }

        // Send test notification to the admin user
        const result = await pushService.sendToUser(user.id, {
            title: 'Test Push Notification',
            body: 'Push notifications are working correctly!',
            icon: '/icon-192.png',
            url: '/admin?section=settings',
            tag: 'test-notification',
        });

        if (result.sent === 0) {
            return NextResponse.json({
                error: 'No push subscriptions found. Please enable push notifications in your browser first.',
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            sent: result.sent,
            failed: result.failed,
        });
    } catch (error) {
        console.error('Error sending test push:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error',
        }, { status: 500 });
    }
}
