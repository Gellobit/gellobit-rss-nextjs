import webPush, { PushSubscription, SendResult } from 'web-push';
import { createAdminClient } from '@/lib/utils/supabase-admin';

export interface PushConfig {
    publicKey: string;
    privateKey: string;
    subject: string;
}

export interface PushNotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;
    tag?: string;
    data?: Record<string, unknown>;
}

export interface PushSubscriptionData {
    endpoint: string;
    p256dh: string;
    auth: string;
}

/**
 * Push Notification Service using Web Push
 */
export class PushService {
    private config: PushConfig | null = null;
    private configured = false;

    /**
     * Load VAPID configuration from database or environment
     */
    private async loadConfig(): Promise<PushConfig | null> {
        if (this.configured && this.config) {
            return this.config;
        }

        try {
            const supabase = createAdminClient();

            // Get config from database
            const { data: settings } = await supabase
                .from('system_settings')
                .select('key, value')
                .in('key', [
                    'push.vapid_public_key',
                    'push.vapid_private_key',
                    'push.vapid_subject',
                ]);

            const settingsMap: Record<string, string> = {};
            settings?.forEach(s => {
                const key = s.key.replace('push.', '');
                const val = s.value;
                settingsMap[key] = typeof val === 'string' ? val : (val ? String(val) : '');
            });

            // Fall back to environment variables
            const publicKey = settingsMap['vapid_public_key'] || process.env.VAPID_PUBLIC_KEY;
            const privateKey = settingsMap['vapid_private_key'] || process.env.VAPID_PRIVATE_KEY;
            const subject = settingsMap['vapid_subject'] || process.env.VAPID_SUBJECT || 'mailto:hello@gellobit.com';

            if (!publicKey || !privateKey) {
                console.warn('Push service: VAPID keys not configured');
                return null;
            }

            this.config = {
                publicKey,
                privateKey,
                subject,
            };

            // Configure web-push
            webPush.setVapidDetails(this.config.subject, this.config.publicKey, this.config.privateKey);
            this.configured = true;

            return this.config;
        } catch (error) {
            console.error('Error loading push config:', error);
            return null;
        }
    }

    /**
     * Check if push service is configured
     */
    async isConfigured(): Promise<boolean> {
        const config = await this.loadConfig();
        return config !== null;
    }

    /**
     * Get public VAPID key for client subscription
     */
    async getPublicKey(): Promise<string | null> {
        const config = await this.loadConfig();
        return config?.publicKey || null;
    }

    /**
     * Send push notification to a specific subscription
     */
    async sendToSubscription(
        subscription: PushSubscriptionData,
        payload: PushNotificationPayload
    ): Promise<{ success: boolean; error?: string }> {
        const config = await this.loadConfig();

        if (!config) {
            console.error('[Push] Service not configured');
            return { success: false, error: 'Push service not configured' };
        }

        try {
            console.log('[Push] Sending to endpoint:', subscription.endpoint.substring(0, 60) + '...');
            console.log('[Push] Payload:', JSON.stringify(payload));

            const pushSubscription: PushSubscription = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.p256dh,
                    auth: subscription.auth,
                },
            };

            const result: SendResult = await webPush.sendNotification(
                pushSubscription,
                JSON.stringify(payload)
            );

            console.log('[Push] Result status:', result.statusCode);
            return { success: result.statusCode >= 200 && result.statusCode < 300 };
        } catch (error: unknown) {
            const err = error as { statusCode?: number; message?: string; body?: string };
            console.error('[Push] Notification error:', {
                statusCode: err.statusCode,
                message: err.message,
                body: err.body,
            });

            // If subscription is invalid (410 Gone), we should remove it
            if (err.statusCode === 410 || err.statusCode === 404) {
                await this.removeInvalidSubscription(subscription.endpoint);
            }

            return {
                success: false,
                error: err.message || 'Failed to send push notification',
            };
        }
    }

    /**
     * Send push notification to a user (all their subscriptions)
     */
    async sendToUser(
        userId: string,
        payload: PushNotificationPayload
    ): Promise<{ sent: number; failed: number }> {
        const supabase = createAdminClient();

        // Get all subscriptions for this user
        const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('endpoint, p256dh, auth')
            .eq('user_id', userId);

        if (!subscriptions || subscriptions.length === 0) {
            return { sent: 0, failed: 0 };
        }

        let sent = 0;
        let failed = 0;

        for (const sub of subscriptions) {
            const result = await this.sendToSubscription(sub, payload);
            if (result.success) {
                sent++;
                // Update last_used_at
                await supabase
                    .from('push_subscriptions')
                    .update({ last_used_at: new Date().toISOString() })
                    .eq('endpoint', sub.endpoint);
            } else {
                failed++;
            }
        }

        return { sent, failed };
    }

    /**
     * Send push notification to multiple users
     */
    async sendToUsers(
        userIds: string[],
        payload: PushNotificationPayload
    ): Promise<{ sent: number; failed: number }> {
        let totalSent = 0;
        let totalFailed = 0;

        for (const userId of userIds) {
            const result = await this.sendToUser(userId, payload);
            totalSent += result.sent;
            totalFailed += result.failed;
        }

        return { sent: totalSent, failed: totalFailed };
    }

    /**
     * Remove invalid subscription from database
     */
    private async removeInvalidSubscription(endpoint: string): Promise<void> {
        try {
            const supabase = createAdminClient();
            await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', endpoint);
            console.log('Removed invalid push subscription:', endpoint);
        } catch (error) {
            console.error('Error removing invalid subscription:', error);
        }
    }

    /**
     * Generate new VAPID keys (utility function for setup)
     */
    static generateVapidKeys(): { publicKey: string; privateKey: string } {
        return webPush.generateVAPIDKeys();
    }
}

// Export singleton instance
export const pushService = new PushService();
