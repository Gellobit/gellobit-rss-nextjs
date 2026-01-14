import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import AuthForm from './AuthForm';

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
    ['branding-auth'],
    { revalidate: 300, tags: ['branding'] }
);

export default async function AuthPage() {
    const branding = await getBranding();

    return <AuthForm branding={branding} />;
}
