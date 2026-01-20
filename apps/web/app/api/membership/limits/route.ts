import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { unstable_cache } from 'next/cache';

// Default limits if settings don't exist
const DEFAULT_LIMITS = {
    freeContentPercentage: 60,
    freeDelayHours: 24,
    freeFavoritesLimit: 5,
    showLockedContent: true,
    lockedContentBlur: true,
    systemEnabled: true,
};

// Cache the limits for 5 minutes
const getMembershipLimits = unstable_cache(
    async () => {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('system_settings')
            .select('key, value')
            .eq('category', 'membership')
            .in('key', [
                'membership.free_content_percentage',
                'membership.free_delay_hours',
                'membership.free_favorites_limit',
                'membership.show_locked_content',
                'membership.locked_content_blur',
                'membership.system_enabled',
            ]);

        if (error || !data) {
            console.error('Error fetching membership limits:', error);
            return DEFAULT_LIMITS;
        }

        const limits = { ...DEFAULT_LIMITS };

        for (const row of data) {
            let value = row.value;

            // Parse JSON values
            if (typeof value === 'string') {
                try {
                    value = JSON.parse(value);
                } catch {
                    // Keep as string/number
                }
            }

            switch (row.key) {
                case 'membership.free_content_percentage':
                    limits.freeContentPercentage = Number(value) || DEFAULT_LIMITS.freeContentPercentage;
                    break;
                case 'membership.free_delay_hours':
                    limits.freeDelayHours = Number(value) || DEFAULT_LIMITS.freeDelayHours;
                    break;
                case 'membership.free_favorites_limit':
                    limits.freeFavoritesLimit = Number(value) || DEFAULT_LIMITS.freeFavoritesLimit;
                    break;
                case 'membership.show_locked_content':
                    limits.showLockedContent = value === true || value === 'true';
                    break;
                case 'membership.locked_content_blur':
                    limits.lockedContentBlur = value === true || value === 'true';
                    break;
                case 'membership.system_enabled':
                    limits.systemEnabled = value !== false && value !== 'false';
                    break;
            }
        }

        return limits;
    },
    ['membership-limits'],
    { revalidate: 300, tags: ['membership'] }
);

export async function GET() {
    try {
        const limits = await getMembershipLimits();
        return NextResponse.json(limits);
    } catch (error) {
        console.error('Error fetching membership limits:', error);
        return NextResponse.json(DEFAULT_LIMITS);
    }
}
