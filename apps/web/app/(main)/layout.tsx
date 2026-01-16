import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import AppHeader from '@/components/AppHeader';
import MobileNavBar from '@/components/MobileNavBar';

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
    ['branding-main'],
    { revalidate: 300, tags: ['branding'] }
);

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const branding = await getBranding();

    return (
        <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
            <AppHeader branding={branding} />
            {children}
            <MobileNavBar />
        </div>
    );
}
