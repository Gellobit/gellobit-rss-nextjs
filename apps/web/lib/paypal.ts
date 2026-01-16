/**
 * PayPal API utilities for server-side operations
 */

const PAYPAL_API_BASE = process.env.NODE_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

interface PayPalAccessToken {
    access_token: string;
    token_type: string;
    expires_in: number;
}

interface PayPalSubscription {
    id: string;
    status: 'APPROVAL_PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
    plan_id: string;
    start_time: string;
    subscriber: {
        email_address: string;
        payer_id: string;
    };
    billing_info?: {
        next_billing_time?: string;
        last_payment?: {
            amount: {
                currency_code: string;
                value: string;
            };
            time: string;
        };
    };
}

/**
 * Get PayPal access token using client credentials
 */
export async function getPayPalAccessToken(): Promise<string> {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('PayPal credentials not configured');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('PayPal auth error:', error);
        throw new Error('Failed to authenticate with PayPal');
    }

    const data: PayPalAccessToken = await response.json();
    return data.access_token;
}

/**
 * Get subscription details from PayPal
 */
export async function getPayPalSubscription(subscriptionId: string): Promise<PayPalSubscription> {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('PayPal subscription fetch error:', error);
        throw new Error('Failed to fetch subscription from PayPal');
    }

    return response.json();
}

/**
 * Verify a PayPal webhook signature
 */
export async function verifyPayPalWebhook(
    webhookId: string,
    headers: Record<string, string>,
    body: string
): Promise<boolean> {
    const accessToken = await getPayPalAccessToken();

    const verificationPayload = {
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
    };

    const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationPayload),
    });

    if (!response.ok) {
        console.error('PayPal webhook verification failed');
        return false;
    }

    const result = await response.json();
    return result.verification_status === 'SUCCESS';
}

/**
 * Cancel a PayPal subscription
 */
export async function cancelPayPalSubscription(subscriptionId: string, reason: string): Promise<boolean> {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
    });

    return response.ok || response.status === 204;
}

/**
 * Calculate membership expiration date based on plan type
 */
export function calculateMembershipExpiration(planType: 'monthly' | 'annual'): Date {
    const now = new Date();
    if (planType === 'annual') {
        return new Date(now.setFullYear(now.getFullYear() + 1));
    }
    return new Date(now.setMonth(now.getMonth() + 1));
}
