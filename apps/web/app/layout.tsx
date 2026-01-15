import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@/context/UserContext'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import GoogleOneTap from '@/components/GoogleOneTap'
import { createAdminClient } from '@/lib/utils/supabase-admin'
import { unstable_cache } from 'next/cache'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
    title: 'Gellobit | Verified Giveaways, Job Fairs & Scholarships',
    description: 'Verified opportunities in the USA.',
}

// Cached function to fetch analytics settings
const getAnalyticsSettings = unstable_cache(
    async () => {
        try {
            const supabase = createAdminClient();
            const { data } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'analytics.google_analytics_id')
                .maybeSingle();
            return data?.value || null;
        } catch (error) {
            console.error('Error fetching GA ID:', error);
            return null;
        }
    },
    ['analytics-ga'],
    { revalidate: 300, tags: ['analytics'] }
);

// Cached function to fetch custom CSS
const getCustomCSS = unstable_cache(
    async () => {
        try {
            const supabase = createAdminClient();
            const { data } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'personalization.custom_css')
                .maybeSingle();
            return data?.value || '';
        } catch (error) {
            console.error('Error fetching custom CSS:', error);
            return '';
        }
    },
    ['custom-css'],
    { revalidate: 300, tags: ['personalization'] }
);

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [gaId, customCSS] = await Promise.all([
        getAnalyticsSettings(),
        getCustomCSS()
    ]);

    return (
        <html lang="en">
            <body className={inter.className}>
                {customCSS && (
                    <style dangerouslySetInnerHTML={{ __html: customCSS }} />
                )}
                <GoogleAnalytics gaId={gaId} />
                <UserProvider>
                    <GoogleOneTap />
                    {children}
                </UserProvider>
            </body>
        </html>
    )
}
