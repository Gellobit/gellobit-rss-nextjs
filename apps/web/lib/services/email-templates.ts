/**
 * Email Templates for Gellobit
 * All templates use inline styles for maximum email client compatibility
 */

interface OpportunityData {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    opportunity_type: string;
    deadline?: string | null;
    prize_value?: string | null;
    featured_image_url?: string | null;
}

// Shared styles
const styles = {
    container: 'max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;',
    header: 'background-color: #FFDE59; padding: 24px; text-align: center;',
    logo: 'font-size: 24px; font-weight: 900; color: #1a1a1a; text-decoration: none;',
    body: 'padding: 32px 24px; background-color: #ffffff;',
    footer: 'padding: 24px; background-color: #f8fafc; text-align: center; font-size: 12px; color: #64748b;',
    button: 'display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px;',
    buttonYellow: 'display: inline-block; background-color: #FFDE59; color: #1a1a1a; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px;',
    card: 'background-color: #f8fafc; border-radius: 16px; padding: 20px; margin-bottom: 16px;',
    badge: 'display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;',
    heading: 'font-size: 24px; font-weight: 800; color: #1a1a1a; margin: 0 0 16px 0;',
    subheading: 'font-size: 18px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px 0;',
    text: 'font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 16px 0;',
    link: 'color: #2563eb; text-decoration: none;',
    divider: 'border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;',
};

// Badge colors for opportunity types
const badgeColors: Record<string, { bg: string; text: string }> = {
    giveaway: { bg: '#fef3c7', text: '#92400e' },
    contest: { bg: '#ffedd5', text: '#9a3412' },
    sweepstakes: { bg: '#f3e8ff', text: '#7c3aed' },
    dream_job: { bg: '#1e293b', text: '#ffffff' },
    job_fair: { bg: '#1e293b', text: '#ffffff' },
    scholarship: { bg: '#dcfce7', text: '#166534' },
    free_training: { bg: '#cffafe', text: '#0e7490' },
    get_paid_to: { bg: '#d1fae5', text: '#065f46' },
    instant_win: { bg: '#fee2e2', text: '#dc2626' },
    volunteer: { bg: '#ccfbf1', text: '#0f766e' },
    promo: { bg: '#fef3c7', text: '#b45309' },
};

const typeLabels: Record<string, string> = {
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
};

function getTypeBadge(type: string): string {
    const colors = badgeColors[type] || { bg: '#f1f5f9', text: '#475569' };
    const label = typeLabels[type] || type;
    return `<span style="${styles.badge} background-color: ${colors.bg}; color: ${colors.text};">${label}</span>`;
}

function baseTemplate(content: string, unsubscribeUrl?: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gellobit</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
    <div style="${styles.container}">
        <!-- Header -->
        <div style="${styles.header}">
            <a href="https://gellobit.com" style="${styles.logo}">
                Gellobit
            </a>
        </div>

        <!-- Body -->
        <div style="${styles.body}">
            ${content}
        </div>

        <!-- Footer -->
        <div style="${styles.footer}">
            <p style="margin: 0 0 8px 0;">
                Gellobit - Verified USA Opportunities
            </p>
            ${unsubscribeUrl ? `
            <p style="margin: 0;">
                <a href="${unsubscribeUrl}" style="${styles.link}">Manage notification preferences</a>
            </p>
            ` : ''}
            <p style="margin: 8px 0 0 0; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} Gellobit. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
`;
}

/**
 * New Opportunity Email Template
 */
export function NewOpportunityEmail({
    opportunity,
    appUrl,
    unsubscribeUrl,
}: {
    opportunity: OpportunityData;
    appUrl: string;
    unsubscribeUrl: string;
}): string {
    const opportunityUrl = `${appUrl}/opportunities/${opportunity.slug}`;
    const imageHtml = opportunity.featured_image_url
        ? `<img src="${opportunity.featured_image_url}" alt="${opportunity.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 16px;">`
        : '';

    const content = `
        <h1 style="${styles.heading}">New ${typeLabels[opportunity.opportunity_type] || 'Opportunity'} Alert!</h1>

        <p style="${styles.text}">
            A new opportunity matching your interests has just been published.
        </p>

        <div style="${styles.card}">
            ${imageHtml}
            <div style="margin-bottom: 12px;">
                ${getTypeBadge(opportunity.opportunity_type)}
            </div>
            <h2 style="${styles.subheading}">${opportunity.title}</h2>
            <p style="${styles.text}">${opportunity.excerpt}</p>

            ${opportunity.deadline ? `
            <p style="font-size: 13px; color: #ef4444; margin: 0 0 8px 0;">
                <strong>Deadline:</strong> ${new Date(opportunity.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            ` : ''}

            ${opportunity.prize_value ? `
            <p style="font-size: 13px; color: #059669; margin: 0 0 16px 0;">
                <strong>Prize Value:</strong> ${opportunity.prize_value}
            </p>
            ` : ''}

            <a href="${opportunityUrl}" style="${styles.button}">
                View Opportunity &rarr;
            </a>
        </div>

        <hr style="${styles.divider}">

        <p style="font-size: 13px; color: #64748b; text-align: center;">
            Don't miss out! Click the button above to learn more and apply.
        </p>
    `;

    return baseTemplate(content, unsubscribeUrl);
}

/**
 * Weekly Digest Email Template
 */
export function WeeklyDigestEmail({
    opportunities,
    appUrl,
    unsubscribeUrl,
}: {
    opportunities: OpportunityData[];
    appUrl: string;
    unsubscribeUrl: string;
}): string {
    const opportunityCards = opportunities.slice(0, 10).map(opp => `
        <div style="${styles.card}">
            <div style="margin-bottom: 8px;">
                ${getTypeBadge(opp.opportunity_type)}
            </div>
            <h3 style="font-size: 16px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px 0;">
                <a href="${appUrl}/opportunities/${opp.slug}" style="color: #1a1a1a; text-decoration: none;">
                    ${opp.title}
                </a>
            </h3>
            <p style="font-size: 14px; color: #64748b; margin: 0 0 12px 0; line-height: 1.5;">
                ${opp.excerpt.substring(0, 120)}${opp.excerpt.length > 120 ? '...' : ''}
            </p>
            ${opp.deadline ? `
            <p style="font-size: 12px; color: #ef4444; margin: 0;">
                Deadline: ${new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
            ` : ''}
        </div>
    `).join('');

    const content = `
        <h1 style="${styles.heading}">Your Weekly Digest</h1>

        <p style="${styles.text}">
            Here are the top ${opportunities.length} opportunities from this week that match your interests.
        </p>

        ${opportunityCards}

        <div style="text-align: center; margin-top: 24px;">
            <a href="${appUrl}/opportunities" style="${styles.buttonYellow}">
                Browse All Opportunities
            </a>
        </div>

        <hr style="${styles.divider}">

        <p style="font-size: 13px; color: #64748b; text-align: center;">
            This is your weekly digest. You can change your email preferences anytime.
        </p>
    `;

    return baseTemplate(content, unsubscribeUrl);
}

/**
 * Favorite Expiring Email Template
 */
export function FavoriteExpiringEmail({
    opportunity,
    daysUntilExpiry,
    appUrl,
    unsubscribeUrl,
}: {
    opportunity: OpportunityData;
    daysUntilExpiry: number;
    appUrl: string;
    unsubscribeUrl: string;
}): string {
    const opportunityUrl = `${appUrl}/opportunities/${opportunity.slug}`;
    const urgencyColor = daysUntilExpiry <= 1 ? '#dc2626' : daysUntilExpiry <= 3 ? '#f59e0b' : '#3b82f6';

    const content = `
        <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; background-color: ${urgencyColor}; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 700;">
                ${daysUntilExpiry <= 1 ? 'Expires Tomorrow!' : `${daysUntilExpiry} Days Left`}
            </span>
        </div>

        <h1 style="${styles.heading}">Don't Forget Your Saved Opportunity</h1>

        <p style="${styles.text}">
            One of your saved opportunities is expiring soon. Don't miss your chance!
        </p>

        <div style="${styles.card}">
            <div style="margin-bottom: 12px;">
                ${getTypeBadge(opportunity.opportunity_type)}
            </div>
            <h2 style="${styles.subheading}">${opportunity.title}</h2>
            <p style="${styles.text}">${opportunity.excerpt}</p>

            ${opportunity.deadline ? `
            <p style="font-size: 14px; color: #ef4444; font-weight: 600; margin: 0 0 16px 0;">
                Expires: ${new Date(opportunity.deadline).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            ` : ''}

            <a href="${opportunityUrl}" style="${styles.button}">
                Apply Now &rarr;
            </a>
        </div>
    `;

    return baseTemplate(content, unsubscribeUrl);
}

/**
 * Welcome Email Template
 */
export function WelcomeEmail({
    displayName,
    appUrl,
}: {
    displayName: string;
    appUrl: string;
}): string {
    const content = `
        <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px;">🎉</span>
        </div>

        <h1 style="${styles.heading} text-align: center;">Welcome to Gellobit${displayName ? `, ${displayName}` : ''}!</h1>

        <p style="${styles.text} text-align: center;">
            You've joined the best platform for discovering verified giveaways, scholarships, job fairs, and more across the USA.
        </p>

        <hr style="${styles.divider}">

        <h2 style="${styles.subheading}">What you can do:</h2>

        <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                <span style="font-size: 24px; margin-right: 12px;">🔍</span>
                <div>
                    <strong style="color: #1a1a1a;">Browse Opportunities</strong>
                    <p style="font-size: 14px; color: #64748b; margin: 4px 0 0 0;">
                        Explore hundreds of verified opportunities updated daily.
                    </p>
                </div>
            </div>

            <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                <span style="font-size: 24px; margin-right: 12px;">❤️</span>
                <div>
                    <strong style="color: #1a1a1a;">Save Favorites</strong>
                    <p style="font-size: 14px; color: #64748b; margin: 4px 0 0 0;">
                        Save opportunities to apply later and get reminders before they expire.
                    </p>
                </div>
            </div>

            <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                <span style="font-size: 24px; margin-right: 12px;">🔔</span>
                <div>
                    <strong style="color: #1a1a1a;">Get Notified</strong>
                    <p style="font-size: 14px; color: #64748b; margin: 4px 0 0 0;">
                        Receive alerts when new opportunities match your interests.
                    </p>
                </div>
            </div>
        </div>

        <div style="text-align: center;">
            <a href="${appUrl}/opportunities" style="${styles.buttonYellow}">
                Start Exploring &rarr;
            </a>
        </div>
    `;

    return baseTemplate(content);
}

/**
 * Membership Email Template
 */
export function MembershipEmail({
    type,
    membershipType,
    appUrl,
}: {
    type: 'upgraded' | 'expiring' | 'expired' | 'renewed';
    membershipType: string;
    appUrl: string;
}): string {
    const contents: Record<string, { emoji: string; title: string; body: string; cta: string; ctaUrl: string }> = {
        upgraded: {
            emoji: '🎉',
            title: `Welcome to Gellobit ${membershipType}!`,
            body: `Thank you for upgrading! You now have access to all premium features including instant notifications, unlimited favorites, and an ad-free experience.`,
            cta: 'Explore Premium Features',
            ctaUrl: `${appUrl}/opportunities`,
        },
        expiring: {
            emoji: '⏰',
            title: 'Your Membership is Expiring Soon',
            body: `Your Gellobit ${membershipType} membership will expire soon. Renew now to keep your premium benefits.`,
            cta: 'Renew Membership',
            ctaUrl: `${appUrl}/account/membership`,
        },
        expired: {
            emoji: '😢',
            title: 'Your Membership Has Expired',
            body: `Your Gellobit ${membershipType} membership has expired. Reactivate to continue enjoying premium features.`,
            cta: 'Reactivate Membership',
            ctaUrl: `${appUrl}/pricing`,
        },
        renewed: {
            emoji: '✅',
            title: 'Membership Renewed Successfully',
            body: `Your Gellobit ${membershipType} membership has been renewed. Thank you for your continued support!`,
            cta: 'Continue Browsing',
            ctaUrl: `${appUrl}/opportunities`,
        },
    };

    const { emoji, title, body, cta, ctaUrl } = contents[type];

    const content = `
        <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px;">${emoji}</span>
        </div>

        <h1 style="${styles.heading} text-align: center;">${title}</h1>

        <p style="${styles.text} text-align: center;">
            ${body}
        </p>

        <div style="text-align: center; margin-top: 24px;">
            <a href="${ctaUrl}" style="${styles.button}">
                ${cta}
            </a>
        </div>
    `;

    return baseTemplate(content);
}
