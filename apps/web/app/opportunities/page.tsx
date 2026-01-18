import { createAdminClient } from '@/lib/utils/supabase-admin';
import { unstable_cache } from 'next/cache';
import OpportunitiesBrowser from './OpportunitiesBrowser';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Metadata for opportunities page
 * IMPORTANT: This page is protected and should NOT be indexed by search engines
 */
export const metadata: Metadata = {
    title: 'Opportunities',
    description: 'Browse verified opportunities',
    robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
        },
    },
};

// Cached function to fetch branding settings
const getBranding = unstable_cache(
    async () => {
        const supabase = createAdminClient();

        const { data: logoSetting } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'personalization.app_logo_url')
            .maybeSingle();

        const { data: nameSetting } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'personalization.app_name')
            .maybeSingle();

        return {
            logoUrl: logoSetting?.value || null,
            appName: nameSetting?.value || 'GelloBit',
        };
    },
    ['branding-opportunities'],
    { revalidate: 300, tags: ['branding'] }
);

// Fetch all opportunities
async function getOpportunities() {
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('opportunities')
        .select('id, slug, title, excerpt, opportunity_type, deadline, prize_value, location, featured_image_url, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching opportunities:', error);
        return [];
    }

    return data || [];
}

interface PageProps {
    searchParams: Promise<{ q?: string; type?: string }>;
}

// Authentication is handled by middleware
export default async function OpportunitiesPage({ searchParams }: PageProps) {
    const [opportunities, branding] = await Promise.all([
        getOpportunities(),
        getBranding()
    ]);

    const params = await searchParams;

    return (
        <OpportunitiesBrowser
            opportunities={opportunities}
            branding={branding}
            initialSearch={params.q || ''}
            initialType={params.type || ''}
        />
    );
}
