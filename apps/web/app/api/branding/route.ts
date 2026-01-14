import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/utils/supabase-admin';

/**
 * GET /api/branding
 * Returns public branding settings (logo, app name)
 */
export async function GET() {
    try {
        const supabase = createAdminClient();

        const [logoResult, nameResult] = await Promise.all([
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
        ]);

        return NextResponse.json({
            logoUrl: logoResult.data?.value || null,
            appName: nameResult.data?.value || 'GelloBit',
        });
    } catch (error) {
        console.error('Error fetching branding:', error);
        return NextResponse.json({
            logoUrl: null,
            appName: 'GelloBit',
        });
    }
}
