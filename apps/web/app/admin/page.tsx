import { createServerSupabaseClient } from '../../utils/supabase-server';
import { redirect } from 'next/navigation';
import AdminLayout from './AdminLayout';
import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/utils/supabase-admin';

export const dynamic = 'force-dynamic';

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
    ['branding-admin'],
    { revalidate: 300, tags: ['branding'] }
);

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
    const params = await searchParams;
    const supabase = await createServerSupabaseClient();

    // Check Authentication
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/auth');
    }

    // Check Admin Role and fetch branding in parallel
    const [profileResult, branding] = await Promise.all([
        supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single(),
        getBranding()
    ]);

    const { data: profile } = profileResult;

    if (profile?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
                    <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
                    <p className="text-slate-500">You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return <AdminLayout initialSection={params.section || 'dashboard'} branding={branding} />;
}
