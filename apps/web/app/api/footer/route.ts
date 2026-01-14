import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { settingsService } from '@/lib/services/settings.service';

export async function GET(request: NextRequest) {
    try {
        // Fetch all footer-related personalization settings
        const [
            appLogoUrl,
            appName,
            footerTagline,
            footerExploreLinks,
            footerInfoPageIds,
            footerSocialLinks,
            footerBottomLeft,
            footerBottomRight,
        ] = await Promise.all([
            settingsService.get('personalization.app_logo_url'),
            settingsService.get('personalization.app_name'),
            settingsService.get('personalization.footer_tagline'),
            settingsService.get('personalization.footer_explore_links'),
            settingsService.get('personalization.footer_info_page_ids'),
            settingsService.get('personalization.footer_social_links'),
            settingsService.get('personalization.footer_bottom_left'),
            settingsService.get('personalization.footer_bottom_right'),
        ]);

        // Parse page IDs and fetch the actual pages
        const pageIds = footerInfoPageIds ? JSON.parse(footerInfoPageIds) : [];
        let infoPages: { id: string; title: string; slug: string }[] = [];

        if (pageIds.length > 0) {
            const supabase = createAdminClient();
            const { data: pages } = await supabase
                .from('pages')
                .select('id, title, slug')
                .in('id', pageIds)
                .eq('status', 'published');

            if (pages) {
                // Maintain the order from pageIds
                infoPages = pageIds
                    .map((id: string) => pages.find(p => p.id === id))
                    .filter(Boolean);
            }
        }

        const footer = {
            branding: {
                logoUrl: appLogoUrl || null,
                appName: appName || 'GelloBit',
            },
            tagline: footerTagline || 'Empowering the USA community through verified opportunities and valuable content since 2025.',
            exploreLinks: footerExploreLinks ? JSON.parse(footerExploreLinks) : [],
            infoPages,
            socialLinks: footerSocialLinks ? JSON.parse(footerSocialLinks) : [],
            bottomLeft: footerBottomLeft || '© 2026 Gellobit.com. All rights reserved.',
            bottomRight: footerBottomRight || 'Developed with ❤️ for USA',
        };

        return NextResponse.json(footer);
    } catch (error) {
        console.error('Error fetching footer settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
