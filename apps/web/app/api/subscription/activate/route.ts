import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { getPayPalSubscription, calculateMembershipExpiration } from '@/lib/paypal';

export async function POST(request: NextRequest) {
    try {
        // Verify user is authenticated
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { subscriptionId, planType } = body;

        if (!subscriptionId || !planType) {
            return NextResponse.json(
                { error: 'Missing subscriptionId or planType' },
                { status: 400 }
            );
        }

        if (planType !== 'monthly' && planType !== 'annual') {
            return NextResponse.json(
                { error: 'Invalid planType. Must be "monthly" or "annual"' },
                { status: 400 }
            );
        }

        // Verify subscription with PayPal
        let subscription;
        try {
            subscription = await getPayPalSubscription(subscriptionId);
        } catch (error) {
            console.error('PayPal verification error:', error);
            return NextResponse.json(
                { error: 'Failed to verify subscription with PayPal' },
                { status: 400 }
            );
        }

        // Check subscription status
        if (subscription.status !== 'ACTIVE' && subscription.status !== 'APPROVED') {
            return NextResponse.json(
                { error: `Subscription is not active. Status: ${subscription.status}` },
                { status: 400 }
            );
        }

        // Calculate expiration date
        const expiresAt = calculateMembershipExpiration(planType);

        // Update user profile
        const adminSupabase = createAdminClient();

        const { data: profile, error: updateError } = await adminSupabase
            .from('profiles')
            .update({
                membership_type: 'premium',
                paypal_subscription_id: subscriptionId,
                membership_expires_at: expiresAt.toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .select()
            .single();

        if (updateError) {
            console.error('Profile update error:', updateError);
            return NextResponse.json(
                { error: 'Failed to update membership' },
                { status: 500 }
            );
        }

        // Log the subscription activation
        console.log(`Subscription activated for user ${user.id}:`, {
            subscriptionId,
            planType,
            expiresAt: expiresAt.toISOString(),
            paypalStatus: subscription.status,
        });

        return NextResponse.json({
            success: true,
            membership: {
                type: 'premium',
                expiresAt: expiresAt.toISOString(),
                subscriptionId,
            },
        });
    } catch (error) {
        console.error('Subscription activation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
