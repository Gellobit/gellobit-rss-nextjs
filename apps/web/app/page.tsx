import { createServerSupabaseClient } from '../utils/supabase-server';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import { LandingPage } from '../components/LandingPage';
import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/utils/supabase-admin';

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
    ['branding-home'],
    { revalidate: 300, tags: ['branding'] }
);

// Cached function to fetch footer pages
const getFooterPages = unstable_cache(
    async () => {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('pages')
            .select('id, title, slug')
            .eq('status', 'published')
            .eq('show_in_footer', true)
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Error fetching footer pages:', error);
            return [];
        }

        return data || [];
    },
    ['footer-pages'],
    { revalidate: 60, tags: ['pages'] }
);

// This is a Server Component by default in Next.js 13+ (app dir)
export default async function Page() {
    const supabase = await createServerSupabaseClient();

    // Fetch opportunities, branding, and footer pages in parallel
    const [opportunitiesResult, branding, footerPages] = await Promise.all([
        supabase
            .from('opportunities')
            .select('*')
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(6),
        getBranding(),
        getFooterPages()
    ]);

    const { data: opportunities, error } = opportunitiesResult;

    if (error) {
        console.error('Error fetching opportunities:', error);
    }

    return (
        <SubscriptionProvider>
            <LandingPage opportunities={opportunities || []} branding={branding} footerPages={footerPages} />
        </SubscriptionProvider>
    );
}
