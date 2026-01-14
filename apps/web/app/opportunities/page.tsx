import { createAdminClient } from '@/lib/utils/supabase-admin';
import { unstable_cache } from 'next/cache';
import OpportunitiesBrowser from './OpportunitiesBrowser';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

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

export default async function OpportunitiesPage() {
    const [opportunities, branding] = await Promise.all([
        getOpportunities(),
        getBranding()
    ]);

    return <OpportunitiesBrowser opportunities={opportunities} branding={branding} />;
}
