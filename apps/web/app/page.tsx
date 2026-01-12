import { createServerSupabaseClient } from '../utils/supabase-server';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import { LandingPage } from '../components/LandingPage';

// This is a Server Component by default in Next.js 13+ (app dir)
export default async function Page() {
    const supabase = await createServerSupabaseClient();

    // Fetch opportunities from Supabase
    const { data: opportunities, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

    if (error) {
        console.error('Error fetching opportunities:', error);
    }

    return (
        <SubscriptionProvider>
            <LandingPage opportunities={opportunities || []} />
        </SubscriptionProvider>
    );
}
