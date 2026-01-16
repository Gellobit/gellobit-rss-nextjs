import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { emailService } from '@/lib/services/email.service';

/**
 * Cron endpoint to send weekly digest emails
 * Should be triggered weekly (e.g., every Monday morning)
 *
 * Configure in vercel.json:
 * {
 *   "crons": [
 *     { "path": "/api/cron/send-digest", "schedule": "0 9 * * 1" }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createAdminClient();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gellobit.com';

        // Check if email service is configured
        const isConfigured = await emailService.isConfigured();
        if (!isConfigured) {
            return NextResponse.json({
                success: false,
                error: 'Email service not configured',
            });
        }

        // Get opportunities from the last 7 days
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { data: recentOpportunities, error: oppsError } = await supabase
            .from('opportunities')
            .select('id, title, slug, excerpt, opportunity_type, deadline, prize_value, featured_image_url')
            .eq('status', 'published')
            .gte('created_at', oneWeekAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(20);

        if (oppsError) {
            console.error('Error fetching opportunities:', oppsError);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch opportunities',
            });
        }

        if (!recentOpportunities || recentOpportunities.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No opportunities to include in digest',
                emailsSent: 0,
            });
        }

        // Get users who want weekly digest emails
        const { data: usersWithDigest, error: usersError } = await supabase
            .from('user_notification_settings')
            .select('user_id, opportunity_types')
            .eq('email_weekly_digest', true);

        if (usersError) {
            console.error('Error fetching user settings:', usersError);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch user settings',
            });
        }

        // Get all profiles for users who don't have explicit settings (they get digest by default)
        const { data: allProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email');

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch profiles',
            });
        }

        // Create settings map
        const settingsMap = new Map(usersWithDigest?.map(s => [s.user_id, s]) || []);

        // Find users who should receive digest
        const recipients: { email: string; opportunityTypes: string[] }[] = [];

        for (const profile of allProfiles || []) {
            if (!profile.email) continue;

            const settings = settingsMap.get(profile.id);

            // If user has settings, check if they want digest
            // If no settings, include them (default is true for digest)
            if (settings || !settingsMap.has(profile.id)) {
                recipients.push({
                    email: profile.email,
                    opportunityTypes: settings?.opportunity_types || [],
                });
            }
        }

        if (recipients.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No recipients for digest',
                emailsSent: 0,
            });
        }

        // Send digests
        let emailsSent = 0;
        let errors = 0;
        const batchSize = 10;
        const delayBetweenBatches = 1000;

        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);

            await Promise.all(
                batch.map(async ({ email, opportunityTypes }) => {
                    try {
                        // Filter opportunities based on user preferences
                        let userOpportunities = recentOpportunities;

                        if (opportunityTypes.length > 0) {
                            userOpportunities = recentOpportunities.filter(opp =>
                                opportunityTypes.includes(opp.opportunity_type)
                            );
                        }

                        if (userOpportunities.length === 0) {
                            return; // No relevant opportunities for this user
                        }

                        const success = await emailService.sendWeeklyDigestEmail(
                            email,
                            userOpportunities,
                            appUrl
                        );

                        if (success) {
                            emailsSent++;
                        } else {
                            errors++;
                        }
                    } catch (error) {
                        console.error(`Error sending digest to ${email}:`, error);
                        errors++;
                    }
                })
            );

            // Wait between batches
            if (i + batchSize < recipients.length) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }

        return NextResponse.json({
            success: true,
            emailsSent,
            errors,
            opportunitiesIncluded: recentOpportunities.length,
            totalRecipients: recipients.length,
        });
    } catch (error) {
        console.error('Error in send-digest cron:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
    return POST(request);
}
