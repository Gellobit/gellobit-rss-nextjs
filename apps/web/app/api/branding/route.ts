import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/utils/supabase-admin';

/**
 * GET /api/branding
 * Returns public branding settings (logo, app name, logo spin animation)
 */
export async function GET() {
    try {
        const supabase = createAdminClient();

        const [logoResult, nameResult, spinEnabledResult, spinDurationResult] = await Promise.all([
            supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'personalization.app_logo_url')
                .maybeSingle(),
            supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'personalization.app_name')
                .maybeSingle(),
            supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'personalization.logo_spin_enabled')
                .maybeSingle(),
            supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'personalization.logo_spin_duration')
                .maybeSingle(),
        ]);

        // Parse logo spin enabled (could be boolean or string)
        const spinEnabled = spinEnabledResult.data?.value;
        const logoSpinEnabled = spinEnabled === true || spinEnabled === 'true';

        // Parse logo spin duration (default to 6 seconds)
        const spinDuration = spinDurationResult.data?.value;
        const logoSpinDuration = typeof spinDuration === 'number' ? spinDuration : parseInt(spinDuration) || 6;

        return NextResponse.json({
            logoUrl: logoResult.data?.value || null,
            appName: nameResult.data?.value || 'GelloBit',
            logoSpinEnabled,
            logoSpinDuration,
        });
    } catch (error) {
        console.error('Error fetching branding:', error);
        return NextResponse.json({
            logoUrl: null,
            appName: 'GelloBit',
            logoSpinEnabled: false,
            logoSpinDuration: 6,
        });
    }
}
