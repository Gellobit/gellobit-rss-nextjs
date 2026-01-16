import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { verifyPayPalWebhook, getPayPalSubscription } from '@/lib/paypal';

/**
 * PayPal Webhook Event Types we handle
 */
type PayPalWebhookEvent =
    | 'BILLING.SUBSCRIPTION.ACTIVATED'
    | 'BILLING.SUBSCRIPTION.CANCELLED'
    | 'BILLING.SUBSCRIPTION.EXPIRED'
    | 'BILLING.SUBSCRIPTION.SUSPENDED'
    | 'BILLING.SUBSCRIPTION.RE-ACTIVATED'
    | 'BILLING.SUBSCRIPTION.PAYMENT.FAILED'
    | 'PAYMENT.SALE.COMPLETED';

interface WebhookPayload {
    id: string;
    event_type: PayPalWebhookEvent;
    resource: {
        id: string;
        status?: string;
        billing_agreement_id?: string;
        subscriber?: {
            email_address: string;
            payer_id: string;
        };
        billing_info?: {
            next_billing_time?: string;
        };
    };
    create_time: string;
    resource_type: string;
}

/**
 * POST /api/webhooks/paypal
 * Handles PayPal webhook events for subscription lifecycle
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const webhookId = process.env.PAYPAL_WEBHOOK_ID;

        if (!webhookId) {
            console.error('PAYPAL_WEBHOOK_ID not configured');
            return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
        }

        // Get headers for verification
        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
            headers[key.toLowerCase()] = value;
        });

        // Verify webhook signature (skip in development if needed)
        const isProduction = process.env.NODE_ENV === 'production';

        if (isProduction) {
            const isValid = await verifyPayPalWebhook(webhookId, headers, body);
            if (!isValid) {
                console.error('PayPal webhook signature verification failed');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        } else {
            console.log('Development mode: Skipping webhook signature verification');
        }

        const payload: WebhookPayload = JSON.parse(body);
        const { event_type, resource } = payload;

        console.log(`PayPal webhook received: ${event_type}`, {
            resourceId: resource.id,
            status: resource.status,
        });

        // Handle different event types
        switch (event_type) {
            case 'BILLING.SUBSCRIPTION.ACTIVATED':
                await handleSubscriptionActivated(resource);
                break;

            case 'BILLING.SUBSCRIPTION.CANCELLED':
                await handleSubscriptionCancelled(resource);
                break;

            case 'BILLING.SUBSCRIPTION.EXPIRED':
                await handleSubscriptionExpired(resource);
                break;

            case 'BILLING.SUBSCRIPTION.SUSPENDED':
                await handleSubscriptionSuspended(resource);
                break;

            case 'BILLING.SUBSCRIPTION.RE-ACTIVATED':
                await handleSubscriptionReactivated(resource);
                break;

            case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
                await handlePaymentFailed(resource);
                break;

            case 'PAYMENT.SALE.COMPLETED':
                await handlePaymentCompleted(resource);
                break;

            default:
                console.log(`Unhandled webhook event type: ${event_type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('PayPal webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

/**
 * Handle subscription activated event
 * This is a backup - normally activation happens via /api/subscription/activate
 */
async function handleSubscriptionActivated(resource: WebhookPayload['resource']) {
    const subscriptionId = resource.id;

    console.log(`Processing subscription activation: ${subscriptionId}`);

    const profile = await findProfileBySubscriptionId(subscriptionId);

    if (!profile) {
        console.log(`No profile found for subscription ${subscriptionId} - may be handled by activate endpoint`);
        return;
    }

    const supabase = createAdminClient();

    await supabase
        .from('profiles')
        .update({
            membership_type: 'premium',
            updated_at: new Date().toISOString(),
        })
        .eq('paypal_subscription_id', subscriptionId);

    console.log(`Subscription activated for profile via webhook: ${profile.id}`);
}

/**
 * Handle subscription cancelled event
 * User cancelled but may still have access until period ends
 */
async function handleSubscriptionCancelled(resource: WebhookPayload['resource']) {
    const subscriptionId = resource.id;

    console.log(`Processing subscription cancellation: ${subscriptionId}`);

    const supabase = createAdminClient();

    // Mark as cancelled but don't immediately downgrade
    // The membership_expires_at date will handle access expiration
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, membership_expires_at')
        .eq('paypal_subscription_id', subscriptionId)
        .single();

    if (!profile) {
        console.log(`No profile found for cancelled subscription: ${subscriptionId}`);
        return;
    }

    // If already expired, downgrade immediately
    const now = new Date();
    const expiresAt = profile.membership_expires_at ? new Date(profile.membership_expires_at) : null;

    if (!expiresAt || expiresAt <= now) {
        await supabase
            .from('profiles')
            .update({
                membership_type: 'free',
                paypal_subscription_id: null,
                membership_expires_at: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id);

        console.log(`User ${profile.id} downgraded immediately (expired)`);
    } else {
        console.log(`User ${profile.id} will be downgraded at ${expiresAt.toISOString()}`);
    }
}

/**
 * Handle subscription expired event
 * Subscription period ended, downgrade user
 */
async function handleSubscriptionExpired(resource: WebhookPayload['resource']) {
    const subscriptionId = resource.id;

    console.log(`Processing subscription expiration: ${subscriptionId}`);

    const supabase = createAdminClient();

    const { error } = await supabase
        .from('profiles')
        .update({
            membership_type: 'free',
            paypal_subscription_id: null,
            membership_expires_at: null,
            updated_at: new Date().toISOString(),
        })
        .eq('paypal_subscription_id', subscriptionId);

    if (error) {
        console.error(`Failed to expire subscription ${subscriptionId}:`, error);
    } else {
        console.log(`Subscription expired and user downgraded: ${subscriptionId}`);
    }
}

/**
 * Handle subscription suspended event
 * Usually due to payment issues - downgrade to free until resolved
 */
async function handleSubscriptionSuspended(resource: WebhookPayload['resource']) {
    const subscriptionId = resource.id;

    console.log(`Processing subscription suspension: ${subscriptionId}`);

    const supabase = createAdminClient();

    // Downgrade to free - user needs to resolve payment issues with PayPal
    // Keep the subscription ID so we can reactivate if they fix payment
    const { error } = await supabase
        .from('profiles')
        .update({
            membership_type: 'free',
            updated_at: new Date().toISOString(),
        })
        .eq('paypal_subscription_id', subscriptionId);

    if (error) {
        console.error(`Failed to suspend subscription ${subscriptionId}:`, error);
    } else {
        console.log(`Subscription suspended, user downgraded to free: ${subscriptionId}`);
    }
}

/**
 * Handle subscription re-activated event
 * User fixed payment issues and subscription is active again
 */
async function handleSubscriptionReactivated(resource: WebhookPayload['resource']) {
    const subscriptionId = resource.id;

    console.log(`Processing subscription reactivation: ${subscriptionId}`);

    try {
        // Get subscription details from PayPal to get next billing time
        const subscription = await getPayPalSubscription(subscriptionId);

        const supabase = createAdminClient();

        // Calculate new expiration date
        let expiresAt: Date;
        if (subscription.billing_info?.next_billing_time) {
            expiresAt = new Date(subscription.billing_info.next_billing_time);
        } else {
            // Fallback: 1 month from now
            expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + 1);
        }

        // Restore premium access
        const { error } = await supabase
            .from('profiles')
            .update({
                membership_type: 'premium',
                membership_expires_at: expiresAt.toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('paypal_subscription_id', subscriptionId);

        if (error) {
            console.error(`Failed to reactivate subscription ${subscriptionId}:`, error);
        } else {
            console.log(`Subscription reactivated: ${subscriptionId}, expires: ${expiresAt.toISOString()}`);
        }
    } catch (error) {
        console.error(`Error reactivating subscription ${subscriptionId}:`, error);
    }
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(resource: WebhookPayload['resource']) {
    const subscriptionId = resource.billing_agreement_id || resource.id;

    console.log(`Payment failed for subscription: ${subscriptionId}`);

    // PayPal will retry payment, just log for now
    // After multiple failures, PayPal will suspend/cancel the subscription
}

/**
 * Handle successful recurring payment
 * Extend the membership expiration date
 */
async function handlePaymentCompleted(resource: WebhookPayload['resource']) {
    const subscriptionId = resource.billing_agreement_id;

    if (!subscriptionId) {
        console.log('Payment completed but no subscription ID - may be one-time payment');
        return;
    }

    console.log(`Processing recurring payment for: ${subscriptionId}`);

    try {
        // Get subscription details to determine plan type
        const subscription = await getPayPalSubscription(subscriptionId);

        const supabase = createAdminClient();

        // Get current profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, membership_expires_at')
            .eq('paypal_subscription_id', subscriptionId)
            .single();

        if (!profile) {
            console.log(`No profile found for payment: ${subscriptionId}`);
            return;
        }

        // Calculate new expiration based on next billing time from PayPal
        let newExpiration: Date;

        if (subscription.billing_info?.next_billing_time) {
            newExpiration = new Date(subscription.billing_info.next_billing_time);
        } else {
            // Fallback: extend by 1 month from now or current expiration
            const baseDate = profile.membership_expires_at
                ? new Date(profile.membership_expires_at)
                : new Date();
            newExpiration = new Date(baseDate.setMonth(baseDate.getMonth() + 1));
        }

        await supabase
            .from('profiles')
            .update({
                membership_type: 'premium',
                membership_expires_at: newExpiration.toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id);

        console.log(`Membership extended for ${profile.id} until ${newExpiration.toISOString()}`);
    } catch (error) {
        console.error(`Error processing payment for ${subscriptionId}:`, error);
    }
}

/**
 * Helper: Find profile by PayPal subscription ID
 */
async function findProfileBySubscriptionId(subscriptionId: string) {
    const supabase = createAdminClient();

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, membership_type, membership_expires_at')
        .eq('paypal_subscription_id', subscriptionId)
        .single();

    return profile;
}
