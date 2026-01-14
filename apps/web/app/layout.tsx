import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@/context/UserContext'
import GoogleAnalytics from '@/components/GoogleAnalytics'
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

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const gaId = await getAnalyticsSettings();

    return (
        <html lang="en">
            <body className={inter.className}>
                <GoogleAnalytics gaId={gaId} />
                <UserProvider>
                    {children}
                </UserProvider>
            </body>
        </html>
    )
}
