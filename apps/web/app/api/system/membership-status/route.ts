import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { unstable_cache } from 'next/cache';

// Cache the membership system status for 5 minutes
const getMembershipSystemStatus = unstable_cache(
    async () => {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'membership.system_enabled')
            .single();

        if (error || !data) {
            // Default to enabled if setting doesn't exist
            return { enabled: true };
        }

        // Parse the value
        let enabled = true;
        if (typeof data.value === 'string') {
            enabled = data.value !== 'false';
        } else if (typeof data.value === 'boolean') {
            enabled = data.value;
        }

        return { enabled };
    },
    ['membership-system-status'],
    { revalidate: 300, tags: ['membership', 'membership-system'] }
);

export async function GET() {
    try {
        const status = await getMembershipSystemStatus();
        return NextResponse.json({
            enabled: status.enabled,
            message: status.enabled
                ? null
                : 'Membership system is disabled. All content is free for everyone.',
        });
    } catch (error) {
        console.error('Error fetching membership system status:', error);
        // Default to enabled on error
        return NextResponse.json({ enabled: true, message: null });
    }
}
