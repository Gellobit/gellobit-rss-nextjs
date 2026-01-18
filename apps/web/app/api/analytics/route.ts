// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/utils/supabase-admin';

// Public endpoint to fetch analytics settings (cacheable)
// Returns both AdSense (web) and AdMob (native) configuration
export async function GET() {
    try {
        const supabase = createAdminClient();

        const { data: settings } = await supabase
            .from('system_settings')
            .select('key, value')
            .in('key', [
                'analytics.google_analytics_id',
                // AdSense settings
                'analytics.adsense_client_id',
                'analytics.adsense_slot_id',
                'analytics.adsense_slot_sticky',
                'analytics.adsense_slot_sidebar',
                'analytics.adsense_slot_below_title',
                'analytics.adsense_slot_in_content',
                'analytics.adsense_slot_end_of_post',
                'analytics.adsense_slot_after_cta',
                // AdMob settings for native mobile apps
                'analytics.admob_app_id',
                'analytics.admob_banner_id',
                'analytics.admob_interstitial_id',
                'analytics.admob_sticky_id',
                'analytics.admob_in_content_id',
                // Manual banner
                'analytics.manual_banner_image_url',
                'analytics.manual_banner_target_url',
                'analytics.manual_banner_enabled'
            ]);

        const result: Record<string, any> = {};
        settings?.forEach(s => {
            const shortKey = s.key.replace('analytics.', '');
            result[shortKey] = s.value;
        });

        return NextResponse.json({
            google_analytics_id: result.google_analytics_id || '',
            // AdSense (web)
            adsense_client_id: result.adsense_client_id || '',
            adsense_slot_id: result.adsense_slot_id || '',
            adsense_slot_sticky: result.adsense_slot_sticky || '',
            adsense_slot_sidebar: result.adsense_slot_sidebar || '',
            adsense_slot_below_title: result.adsense_slot_below_title || '',
            adsense_slot_in_content: result.adsense_slot_in_content || '',
            adsense_slot_end_of_post: result.adsense_slot_end_of_post || '',
            adsense_slot_after_cta: result.adsense_slot_after_cta || '',
            // AdMob (native)
            admob_app_id: result.admob_app_id || '',
            admob_banner_id: result.admob_banner_id || '',
            admob_interstitial_id: result.admob_interstitial_id || '',
            admob_sticky_id: result.admob_sticky_id || '',
            admob_in_content_id: result.admob_in_content_id || '',
            // Manual banner
            manual_banner_image_url: result.manual_banner_image_url || '',
            manual_banner_target_url: result.manual_banner_target_url || '',
            manual_banner_enabled: result.manual_banner_enabled === true || result.manual_banner_enabled === 'true',
        });
    } catch (error) {
        console.error('Error fetching analytics settings:', error);
        return NextResponse.json({
            google_analytics_id: '',
            // AdSense
            adsense_client_id: '',
            adsense_slot_id: '',
            adsense_slot_sticky: '',
            adsense_slot_sidebar: '',
            adsense_slot_below_title: '',
            adsense_slot_in_content: '',
            adsense_slot_end_of_post: '',
            adsense_slot_after_cta: '',
            // AdMob
            admob_app_id: '',
            admob_banner_id: '',
            admob_interstitial_id: '',
            admob_sticky_id: '',
            admob_in_content_id: '',
            // Manual banner
            manual_banner_image_url: '',
            manual_banner_target_url: '',
            manual_banner_enabled: false,
        });
    }
}
