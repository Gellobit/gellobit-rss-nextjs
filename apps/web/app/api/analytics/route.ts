// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/utils/supabase-admin';

// Public endpoint to fetch analytics settings (cacheable)
export async function GET() {
    try {
        const supabase = createAdminClient();

        const { data: settings } = await supabase
            .from('system_settings')
            .select('key, value')
            .in('key', [
                'analytics.google_analytics_id',
                'analytics.adsense_client_id',
                'analytics.adsense_slot_id'
            ]);

        const result: Record<string, string> = {};
        settings?.forEach(s => {
            const shortKey = s.key.replace('analytics.', '');
            result[shortKey] = s.value || '';
        });

        return NextResponse.json({
            google_analytics_id: result.google_analytics_id || '',
            adsense_client_id: result.adsense_client_id || '',
            adsense_slot_id: result.adsense_slot_id || '',
        });
    } catch (error) {
        console.error('Error fetching analytics settings:', error);
        return NextResponse.json({
            google_analytics_id: '',
            adsense_client_id: '',
            adsense_slot_id: '',
        });
    }
}
