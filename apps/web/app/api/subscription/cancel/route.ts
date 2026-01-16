import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { cancelPayPalSubscription } from '@/lib/paypal';

export async function POST(request: NextRequest) {
    try {
        // Verify user is authenticated
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminSupabase = createAdminClient();

        // Get user's subscription ID
        const { data: profile, error: profileError } = await adminSupabase
            .from('profiles')
            .select('paypal_subscription_id, membership_type')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        if (!profile.paypal_subscription_id) {
            return NextResponse.json(
                { error: 'No active subscription found' },
                { status: 400 }
            );
        }

        // Cancel subscription with PayPal
        const cancelled = await cancelPayPalSubscription(
            profile.paypal_subscription_id,
            'User requested cancellation'
        );

        if (!cancelled) {
            return NextResponse.json(
                { error: 'Failed to cancel subscription with PayPal' },
                { status: 500 }
            );
        }

        // Note: We don't immediately downgrade the user
        // The webhook will handle the actual status change
        // User keeps access until membership_expires_at

        console.log(`Subscription cancelled for user ${user.id}: ${profile.paypal_subscription_id}`);

        return NextResponse.json({
            success: true,
            message: 'Subscription cancelled. You will retain access until the end of your billing period.',
        });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        return NextResponse.json(
            { error: 'Failed to cancel subscription' },
            { status: 500 }
        );
    }
}
