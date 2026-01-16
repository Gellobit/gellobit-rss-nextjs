import { Resend } from 'resend';
import { createAdminClient } from '@/lib/utils/supabase-admin';

// Email templates
import {
    NewOpportunityEmail,
    WeeklyDigestEmail,
    FavoriteExpiringEmail,
    WelcomeEmail,
    MembershipEmail,
} from './email-templates';

export interface EmailConfig {
    apiKey: string;
    fromEmail: string;
    fromName: string;
    replyTo?: string;
}

export interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export interface OpportunityEmailData {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    opportunity_type: string;
    deadline?: string | null;
    prize_value?: string | null;
    featured_image_url?: string | null;
}

/**
 * Email Service using Resend
 */
export class EmailService {
    private resend: Resend | null = null;
    private config: EmailConfig | null = null;

    /**
     * Load email configuration from database or environment
     */
    private async loadConfig(): Promise<EmailConfig | null> {
        try {
            const supabase = createAdminClient();

            // Get config from database
            const { data: settings } = await supabase
                .from('system_settings')
                .select('key, value')
                .in('key', [
                    'email.resend_api_key',
                    'email.from_email',
                    'email.from_name',
                    'email.reply_to',
                ]);

            const settingsMap: Record<string, string> = {};
            settings?.forEach(s => {
                const key = s.key.replace('email.', '');
                // value is JSONB, so it could be a string directly or need parsing
                const val = s.value;
                settingsMap[key] = typeof val === 'string' ? val : (val ? String(val) : '');
            });

            // Fall back to environment variables
            const apiKey = settingsMap['resend_api_key'] || process.env.RESEND_API_KEY;
            const fromEmail = settingsMap['from_email'] || process.env.EMAIL_FROM || 'noreply@gellobit.com';
            const fromName = settingsMap['from_name'] || process.env.EMAIL_FROM_NAME || 'Gellobit';
            const replyTo = settingsMap['reply_to'] || process.env.EMAIL_REPLY_TO;

            if (!apiKey) {
                console.warn('Email service: No API key configured');
                return null;
            }

            this.config = {
                apiKey,
                fromEmail,
                fromName,
                replyTo,
            };

            this.resend = new Resend(apiKey);

            return this.config;
        } catch (error) {
            console.error('Error loading email config:', error);
            return null;
        }
    }

    /**
     * Check if email service is configured and ready
     */
    async isConfigured(): Promise<boolean> {
        const config = await this.loadConfig();
        return config !== null && this.resend !== null;
    }

    /**
     * Send an email
     */
    async send(params: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
        const config = await this.loadConfig();

        if (!config || !this.resend) {
            return { success: false, error: 'Email service not configured' };
        }

        try {
            const { data, error } = await this.resend.emails.send({
                from: `${config.fromName} <${config.fromEmail}>`,
                to: params.to,
                subject: params.subject,
                html: params.html,
                text: params.text,
                replyTo: config.replyTo,
            });

            if (error) {
                console.error('Resend error:', error);
                return { success: false, error: error.message };
            }

            return { success: true, id: data?.id };
        } catch (error) {
            console.error('Error sending email:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Send new opportunity email to a user
     */
    async sendNewOpportunityEmail(
        to: string,
        opportunity: OpportunityEmailData,
        appUrl: string
    ): Promise<boolean> {
        const html = NewOpportunityEmail({
            opportunity,
            appUrl,
            unsubscribeUrl: `${appUrl}/account/notifications`,
        });

        const result = await this.send({
            to,
            subject: `New ${this.getOpportunityTypeLabel(opportunity.opportunity_type)}: ${opportunity.title}`,
            html,
        });

        return result.success;
    }

    /**
     * Send weekly digest email
     */
    async sendWeeklyDigestEmail(
        to: string,
        opportunities: OpportunityEmailData[],
        appUrl: string
    ): Promise<boolean> {
        if (opportunities.length === 0) {
            return false;
        }

        const html = WeeklyDigestEmail({
            opportunities,
            appUrl,
            unsubscribeUrl: `${appUrl}/account/notifications`,
        });

        const result = await this.send({
            to,
            subject: `Your Weekly Opportunities Digest - ${opportunities.length} new opportunities`,
            html,
        });

        return result.success;
    }

    /**
     * Send favorite expiring email
     */
    async sendFavoriteExpiringEmail(
        to: string,
        opportunity: OpportunityEmailData,
        daysUntilExpiry: number,
        appUrl: string
    ): Promise<boolean> {
        const html = FavoriteExpiringEmail({
            opportunity,
            daysUntilExpiry,
            appUrl,
            unsubscribeUrl: `${appUrl}/account/notifications`,
        });

        const result = await this.send({
            to,
            subject: `Reminder: "${opportunity.title}" expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`,
            html,
        });

        return result.success;
    }

    /**
     * Send welcome email to new user
     */
    async sendWelcomeEmail(to: string, displayName: string, appUrl: string): Promise<boolean> {
        const html = WelcomeEmail({
            displayName,
            appUrl,
        });

        const result = await this.send({
            to,
            subject: 'Welcome to Gellobit! 🎉',
            html,
        });

        return result.success;
    }

    /**
     * Send membership update email
     */
    async sendMembershipEmail(
        to: string,
        type: 'upgraded' | 'expiring' | 'expired' | 'renewed',
        membershipType: string,
        appUrl: string
    ): Promise<boolean> {
        const subjects: Record<string, string> = {
            upgraded: `Welcome to Gellobit ${membershipType}! 🎉`,
            expiring: 'Your Gellobit membership is expiring soon',
            expired: 'Your Gellobit membership has expired',
            renewed: 'Your Gellobit membership has been renewed',
        };

        const html = MembershipEmail({
            type,
            membershipType,
            appUrl,
        });

        const result = await this.send({
            to,
            subject: subjects[type],
            html,
        });

        return result.success;
    }

    /**
     * Get readable label for opportunity type
     */
    private getOpportunityTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            giveaway: 'Giveaway',
            contest: 'Contest',
            sweepstakes: 'Sweepstakes',
            dream_job: 'Dream Job',
            job_fair: 'Job Fair',
            scholarship: 'Scholarship',
            free_training: 'Free Training',
            get_paid_to: 'Get Paid To',
            instant_win: 'Instant Win',
            volunteer: 'Volunteer Opportunity',
            promo: 'Promo',
            evergreen: 'Opportunity',
        };
        return labels[type] || 'Opportunity';
    }
}

// Export singleton instance
export const emailService = new EmailService();
