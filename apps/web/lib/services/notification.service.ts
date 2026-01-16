import { createAdminClient } from '@/lib/utils/supabase-admin';
import { emailService, OpportunityEmailData } from './email.service';
import { pushService } from './push.service';

export type NotificationType = 'new_opportunity' | 'favorite_expiring' | 'system' | 'membership';

// Labels for opportunity types
const OPPORTUNITY_TYPE_LABELS: Record<string, string> = {
    giveaway: 'Giveaway',
    contest: 'Contest',
    sweepstakes: 'Sweepstakes',
    dream_job: 'Dream Job',
    job_fair: 'Job Fair',
    scholarship: 'Scholarship',
    free_training: 'Free Training',
    get_paid_to: 'Get Paid To',
    instant_win: 'Instant Win',
    volunteer: 'Volunteer',
    promo: 'Promo',
    evergreen: 'Evergreen',
};

export interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    title: string;
    message?: string;
    opportunityId?: string;
    metadata?: Record<string, any>;
    expiresAt?: Date;
}

export interface NotifyUsersAboutOpportunityParams {
    opportunityId: string;
    opportunityTitle: string;
    opportunityType: string;
    opportunitySlug: string;
    opportunityExcerpt?: string;
    opportunityDeadline?: string | null;
    opportunityPrizeValue?: string | null;
    opportunityImageUrl?: string | null;
}

/**
 * Notification Service
 * Handles creating and managing in-app notifications
 */
export class NotificationService {
    private supabase = createAdminClient();

    /**
     * Create a single notification for a user
     */
    async createNotification(params: CreateNotificationParams): Promise<string | null> {
        const { userId, type, title, message, opportunityId, metadata, expiresAt } = params;

        try {
            const { data, error } = await this.supabase
                .from('notifications')
                .insert({
                    user_id: userId,
                    type,
                    title,
                    message,
                    opportunity_id: opportunityId,
                    metadata: metadata || {},
                    expires_at: expiresAt?.toISOString(),
                })
                .select('id')
                .single();

            if (error) {
                console.error('Error creating notification:', error);
                return null;
            }

            return data.id;
        } catch (error) {
            console.error('Error in createNotification:', error);
            return null;
        }
    }

    /**
     * Get user's notification preferences
     */
    async getUserNotificationSettings(userId: string) {
        try {
            const { data, error } = await this.supabase
                .from('user_notification_settings')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching notification settings:', error);
                return null;
            }

            // Return defaults if no settings exist
            return data || {
                app_new_opportunities: true,
                app_favorites_expiring: true,
                opportunity_types: [],
                min_prize_value: null,
            };
        } catch (error) {
            console.error('Error in getUserNotificationSettings:', error);
            return null;
        }
    }

    /**
     * Check if user wants to receive notifications for a specific opportunity type
     */
    shouldNotifyForOpportunityType(
        userSettings: { opportunity_types: string[] },
        opportunityType: string
    ): boolean {
        // If no types specified, notify for all
        if (!userSettings.opportunity_types || userSettings.opportunity_types.length === 0) {
            return true;
        }
        return userSettings.opportunity_types.includes(opportunityType);
    }

    /**
     * Notify all eligible users about a new opportunity
     * This checks user preferences before creating notifications
     */
    async notifyUsersAboutNewOpportunity(params: NotifyUsersAboutOpportunityParams): Promise<number> {
        const {
            opportunityId,
            opportunityTitle,
            opportunityType,
            opportunitySlug,
            opportunityExcerpt,
            opportunityDeadline,
            opportunityPrizeValue,
            opportunityImageUrl,
        } = params;

        try {
            // Get all users with their notification settings and email
            const { data: usersWithSettings, error: settingsError } = await this.supabase
                .from('user_notification_settings')
                .select(`
                    user_id,
                    opportunity_types,
                    min_prize_value,
                    app_new_opportunities,
                    email_new_opportunities,
                    push_enabled,
                    push_new_opportunities
                `);

            if (settingsError) {
                console.error('Error fetching user settings:', settingsError);
                return 0;
            }

            // Get all users with their profiles (for email)
            const { data: allProfiles, error: profilesError } = await this.supabase
                .from('profiles')
                .select('id, email');

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
                return 0;
            }

            // Create a map of user settings
            const settingsMap = new Map(usersWithSettings?.map(s => [s.user_id, s]) || []);

            // Process each user
            const inAppNotifications: any[] = [];
            const emailRecipients: { userId: string; email: string }[] = [];
            const pushRecipients: string[] = [];

            for (const profile of allProfiles || []) {
                const settings = settingsMap.get(profile.id);

                // Check opportunity type filter
                const opportunityTypes = settings?.opportunity_types || [];
                if (opportunityTypes.length > 0 && !opportunityTypes.includes(opportunityType)) {
                    continue; // User filtered out this type
                }

                // Check in-app notification preference (default: true)
                const wantsInApp = settings?.app_new_opportunities !== false;
                if (wantsInApp) {
                    inAppNotifications.push({
                        user_id: profile.id,
                        type: 'new_opportunity' as const,
                        title: `New ${OPPORTUNITY_TYPE_LABELS[opportunityType] || 'Opportunity'}`,
                        message: opportunityTitle,
                        opportunity_id: opportunityId,
                        metadata: {
                            opportunity_type: opportunityType,
                            slug: opportunitySlug,
                        },
                        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    });
                }

                // Check email notification preference (default: true)
                const wantsEmail = settings?.email_new_opportunities !== false;
                if (wantsEmail && profile.email) {
                    emailRecipients.push({ userId: profile.id, email: profile.email });
                }

                // Check push notification preference
                const wantsPush = settings?.push_enabled && settings?.push_new_opportunities !== false;
                if (wantsPush) {
                    pushRecipients.push(profile.id);
                }
            }

            // Insert in-app notifications in batches
            let createdCount = 0;
            const batchSize = 100;

            for (let i = 0; i < inAppNotifications.length; i += batchSize) {
                const batch = inAppNotifications.slice(i, i + batchSize);
                const { error: insertError } = await this.supabase
                    .from('notifications')
                    .insert(batch);

                if (insertError) {
                    console.error('Error inserting notification batch:', insertError);
                } else {
                    createdCount += batch.length;
                }
            }

            // Send emails asynchronously (don't block)
            if (emailRecipients.length > 0 && opportunityExcerpt) {
                this.sendOpportunityEmails(emailRecipients, {
                    id: opportunityId,
                    title: opportunityTitle,
                    slug: opportunitySlug,
                    excerpt: opportunityExcerpt,
                    opportunity_type: opportunityType,
                    deadline: opportunityDeadline,
                    prize_value: opportunityPrizeValue,
                    featured_image_url: opportunityImageUrl,
                });
            }

            // Send push notifications asynchronously (don't block)
            if (pushRecipients.length > 0) {
                this.sendOpportunityPushNotifications(pushRecipients, {
                    title: `New ${OPPORTUNITY_TYPE_LABELS[opportunityType] || 'Opportunity'}`,
                    body: opportunityTitle,
                    url: `/opportunity/${opportunitySlug}`,
                    tag: `opportunity-${opportunityId}`,
                });
            }

            return createdCount;
        } catch (error) {
            console.error('Error in notifyUsersAboutNewOpportunity:', error);
            return 0;
        }
    }

    /**
     * Send opportunity emails to recipients (runs asynchronously)
     */
    private async sendOpportunityEmails(
        recipients: { userId: string; email: string }[],
        opportunity: OpportunityEmailData
    ): Promise<void> {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gellobit.com';

        // Check if email service is configured
        const isConfigured = await emailService.isConfigured();
        if (!isConfigured) {
            console.log('Email service not configured, skipping email notifications');
            return;
        }

        // Send emails in batches with rate limiting
        const emailBatchSize = 10;
        const delayBetweenBatches = 1000; // 1 second

        for (let i = 0; i < recipients.length; i += emailBatchSize) {
            const batch = recipients.slice(i, i + emailBatchSize);

            await Promise.all(
                batch.map(async ({ email }) => {
                    try {
                        await emailService.sendNewOpportunityEmail(email, opportunity, appUrl);
                    } catch (error) {
                        console.error(`Error sending email to ${email}:`, error);
                    }
                })
            );

            // Wait between batches to avoid rate limits
            if (i + emailBatchSize < recipients.length) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }

        console.log(`Sent ${recipients.length} opportunity emails`);
    }

    /**
     * Send push notifications to recipients (runs asynchronously)
     */
    private async sendOpportunityPushNotifications(
        userIds: string[],
        notification: { title: string; body: string; url: string; tag: string }
    ): Promise<void> {
        // Check if push service is configured
        const isConfigured = await pushService.isConfigured();
        if (!isConfigured) {
            console.log('Push service not configured, skipping push notifications');
            return;
        }

        try {
            const result = await pushService.sendToUsers(userIds, {
                title: notification.title,
                body: notification.body,
                icon: '/icon-192.png',
                badge: '/badge-72.png',
                url: notification.url,
                tag: notification.tag,
            });

            console.log(`Sent push notifications: ${result.sent} delivered, ${result.failed} failed`);
        } catch (error) {
            console.error('Error sending push notifications:', error);
        }
    }

    /**
     * Notify a user about their favorite expiring
     */
    async notifyFavoriteExpiring(
        userId: string,
        opportunityId: string,
        opportunityTitle: string,
        expiresAt: Date
    ): Promise<boolean> {
        const settings = await this.getUserNotificationSettings(userId);

        if (!settings?.app_favorites_expiring) {
            return false;
        }

        const notification = await this.createNotification({
            userId,
            type: 'favorite_expiring',
            title: 'Favorite Expiring Soon',
            message: `"${opportunityTitle}" expires on ${expiresAt.toLocaleDateString()}`,
            opportunityId,
            metadata: {
                expires_at: expiresAt.toISOString(),
            },
            expiresAt, // Notification expires when the opportunity does
        });

        return notification !== null;
    }

    /**
     * Send a system notification to a user
     */
    async sendSystemNotification(
        userId: string,
        title: string,
        message: string,
        metadata?: Record<string, any>
    ): Promise<boolean> {
        const notification = await this.createNotification({
            userId,
            type: 'system',
            title,
            message,
            metadata,
        });

        return notification !== null;
    }

    /**
     * Send a membership-related notification
     */
    async sendMembershipNotification(
        userId: string,
        title: string,
        message: string,
        metadata?: Record<string, any>
    ): Promise<boolean> {
        const notification = await this.createNotification({
            userId,
            type: 'membership',
            title,
            message,
            metadata,
        });

        return notification !== null;
    }

    /**
     * Clean up expired notifications
     */
    async cleanupExpiredNotifications(): Promise<number> {
        try {
            const { error, count } = await this.supabase
                .from('notifications')
                .delete()
                .lt('expires_at', new Date().toISOString())
                .not('expires_at', 'is', null);

            if (error) {
                console.error('Error cleaning up expired notifications:', error);
                return 0;
            }

            return count || 0;
        } catch (error) {
            console.error('Error in cleanupExpiredNotifications:', error);
            return 0;
        }
    }
}

// Export singleton instance
export const notificationService = new NotificationService();
