import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/utils/supabase-server';
import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import AccountSidebar from './AccountSidebar';
import MobileNavBar from '@/components/MobileNavBar';
import UserNav from '@/components/UserNav';

// Get branding
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
    ['branding'],
    { revalidate: 300, tags: ['branding'] }
);

export default async function AccountLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth?redirect=/account');
    }

    const branding = await getBranding();

    return (
        <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
            {/* Navigation */}
            <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2">
                        {branding.logoUrl ? (
                            <img
                                src={branding.logoUrl}
                                alt={branding.appName}
                                className="h-8 object-contain"
                            />
                        ) : (
                            <>
                                <div className="bg-[#FFDE59] p-1.5 rounded-lg font-black text-sm md:text-lg shadow-sm">GB</div>
                                <span className="hidden md:inline font-black text-xl tracking-tighter text-[#1a1a1a]">{branding.appName}</span>
                            </>
                        )}
                    </a>
                    <h1 className="md:hidden font-bold text-lg">Account</h1>
                    <div className="hidden md:block">
                        <UserNav />
                    </div>
                    <div className="w-8 md:hidden" />
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar - Desktop only */}
                    <div className="hidden md:block">
                        <AccountSidebar />
                    </div>

                    {/* Main Content */}
                    <main className="flex-1">
                        {children}
                    </main>
                </div>
            </div>

            {/* Mobile Navigation */}
            <MobileNavBar />
        </div>
    );
}
