import { createServerSupabaseClient } from '../utils/supabase-server';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import { LandingPage } from '../components/LandingPage';
import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/utils/supabase-admin';

// Cached function to fetch all homepage settings
const getHomepageSettings = unstable_cache(
    async () => {
        const supabase = createAdminClient();

        // Fetch all personalization settings
        const { data: settings } = await supabase
            .from('system_settings')
            .select('key, value')
            .like('key', 'personalization.%');

        const settingsMap: Record<string, string> = {};
        settings?.forEach(s => {
            // Remove 'personalization.' prefix
            const key = s.key.replace('personalization.', '');
            settingsMap[key] = s.value;
        });

        // Branding
        const branding = {
            logoUrl: settingsMap['app_logo_url'] || null,
            footerLogoUrl: settingsMap['app_logo_footer_url'] || null,
            appName: settingsMap['app_name'] || 'GelloBit',
        };

        // Homepage content
        const heroContent = {
            badgeText: settingsMap['hero_badge_text'] || 'New Platform 2.0 Available!',
            title: settingsMap['hero_title'] || 'Verified USA Opportunities',
            titleHighlight: settingsMap['hero_title_highlight'] || 'just a click away.',
            subtitle: settingsMap['hero_subtitle'] || 'Gellobit connects you with real giveaways, job fairs, and scholarships. No scams, just value verified daily by experts.',
            ctaPrimary: settingsMap['hero_cta_primary'] || 'Explore Feed Now',
            ctaSecondary: settingsMap['hero_cta_secondary'] || 'View Pro Plan',
            backgroundColor: settingsMap['hero_background_color'] || '#ffffff',
        };

        // App download section
        const appSection = {
            title: settingsMap['app_section_title'] || 'Carry opportunities in your pocket.',
            subtitle: settingsMap['app_section_subtitle'] || 'Download the mobile App and never miss a job fair or verified giveaway by not being at your PC.',
            playstoreUrl: settingsMap['app_playstore_url'] || '',
            appstoreUrl: settingsMap['app_appstore_url'] || '',
            mockupImageUrl: settingsMap['app_mockup_image_url'] || null,
        };

        // Parse JSON fields for footer
        const exploreLinks = settingsMap['footer_explore_links']
            ? JSON.parse(settingsMap['footer_explore_links'])
            : [];

        const socialLinks = settingsMap['footer_social_links']
            ? JSON.parse(settingsMap['footer_social_links'])
            : [];

        const pageIds = settingsMap['footer_info_page_ids']
            ? JSON.parse(settingsMap['footer_info_page_ids'])
            : [];

        // Fetch pages for footer
        let infoPages: { id: string; title: string; slug: string }[] = [];
        if (pageIds.length > 0) {
            const { data: pages } = await supabase
                .from('pages')
                .select('id, title, slug')
                .in('id', pageIds)
                .eq('status', 'published');

            if (pages) {
                infoPages = pageIds
                    .map((id: string) => pages.find(p => p.id === id))
                    .filter(Boolean);
            }
        }

        const footer = {
            tagline: settingsMap['footer_tagline'] || 'Empowering the USA community through verified opportunities and valuable content since 2025.',
            exploreLinks,
            infoPages,
            socialLinks,
            bottomLeft: settingsMap['footer_bottom_left'] || '© 2026 Gellobit.com. All rights reserved.',
            bottomRight: settingsMap['footer_bottom_right'] || 'Developed with ❤️ for USA',
        };

        return { branding, heroContent, appSection, footer };
    },
    ['homepage-settings'],
    { revalidate: 60, tags: ['personalization', 'pages'] }
);

// This is a Server Component by default in Next.js 13+ (app dir)
export default async function Page() {
    const supabase = await createServerSupabaseClient();

    // Fetch opportunities and homepage settings in parallel
    const [opportunitiesResult, settings] = await Promise.all([
        supabase
            .from('opportunities')
            .select('*')
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(6),
        getHomepageSettings()
    ]);

    const { data: opportunities, error } = opportunitiesResult;

    if (error) {
        console.error('Error fetching opportunities:', error);
    }

    return (
        <SubscriptionProvider>
            <LandingPage
                opportunities={opportunities || []}
                branding={settings.branding}
                heroContent={settings.heroContent}
                appSection={settings.appSection}
                footer={settings.footer}
            />
        </SubscriptionProvider>
    );
}
