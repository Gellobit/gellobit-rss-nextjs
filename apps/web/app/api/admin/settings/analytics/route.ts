// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { settingsService } from '@/lib/services/settings.service';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminSupabase = createAdminClient();
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch analytics settings
        const googleAnalyticsId = await settingsService.get('analytics.google_analytics_id');
        // AdSense settings
        const adsenseClientId = await settingsService.get('analytics.adsense_client_id');
        const adsenseSlotId = await settingsService.get('analytics.adsense_slot_id');
        const adsenseSlotSticky = await settingsService.get('analytics.adsense_slot_sticky');
        const adsenseSlotSidebar = await settingsService.get('analytics.adsense_slot_sidebar');
        const adsenseSlotBelowTitle = await settingsService.get('analytics.adsense_slot_below_title');
        const adsenseSlotInContent = await settingsService.get('analytics.adsense_slot_in_content');
        const adsenseSlotEndOfPost = await settingsService.get('analytics.adsense_slot_end_of_post');
        const adsenseSlotAfterCta = await settingsService.get('analytics.adsense_slot_after_cta');
        // AdMob settings for native mobile apps
        const admobAppId = await settingsService.get('analytics.admob_app_id');
        const admobBannerId = await settingsService.get('analytics.admob_banner_id');
        const admobInterstitialId = await settingsService.get('analytics.admob_interstitial_id');
        const admobStickyId = await settingsService.get('analytics.admob_sticky_id');
        const admobInContentId = await settingsService.get('analytics.admob_in_content_id');
        // Manual banner settings
        const manualBannerImageUrl = await settingsService.get('analytics.manual_banner_image_url');
        const manualBannerTargetUrl = await settingsService.get('analytics.manual_banner_target_url');
        const manualBannerEnabled = await settingsService.get('analytics.manual_banner_enabled');

        const settings = {
            google_analytics_id: googleAnalyticsId || '',
            // AdSense
            adsense_client_id: adsenseClientId || '',
            adsense_slot_id: adsenseSlotId || '',
            adsense_slot_sticky: adsenseSlotSticky || '',
            adsense_slot_sidebar: adsenseSlotSidebar || '',
            adsense_slot_below_title: adsenseSlotBelowTitle || '',
            adsense_slot_in_content: adsenseSlotInContent || '',
            adsense_slot_end_of_post: adsenseSlotEndOfPost || '',
            adsense_slot_after_cta: adsenseSlotAfterCta || '',
            // AdMob
            admob_app_id: admobAppId || '',
            admob_banner_id: admobBannerId || '',
            admob_interstitial_id: admobInterstitialId || '',
            admob_sticky_id: admobStickyId || '',
            admob_in_content_id: admobInContentId || '',
            // Manual banner
            manual_banner_image_url: manualBannerImageUrl || '',
            manual_banner_target_url: manualBannerTargetUrl || '',
            manual_banner_enabled: manualBannerEnabled === true || manualBannerEnabled === 'true',
        };

        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Error fetching analytics settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminSupabase = createAdminClient();
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();

        // Save analytics settings
        const settingsToSave: Record<string, any> = {};

        if ('google_analytics_id' in body) {
            settingsToSave['analytics.google_analytics_id'] = body.google_analytics_id || '';
        }
        if ('adsense_client_id' in body) {
            settingsToSave['analytics.adsense_client_id'] = body.adsense_client_id || '';
        }
        if ('adsense_slot_id' in body) {
            settingsToSave['analytics.adsense_slot_id'] = body.adsense_slot_id || '';
        }
        // AdSense position-specific slots
        if ('adsense_slot_sticky' in body) {
            settingsToSave['analytics.adsense_slot_sticky'] = body.adsense_slot_sticky || '';
        }
        if ('adsense_slot_sidebar' in body) {
            settingsToSave['analytics.adsense_slot_sidebar'] = body.adsense_slot_sidebar || '';
        }
        if ('adsense_slot_below_title' in body) {
            settingsToSave['analytics.adsense_slot_below_title'] = body.adsense_slot_below_title || '';
        }
        if ('adsense_slot_in_content' in body) {
            settingsToSave['analytics.adsense_slot_in_content'] = body.adsense_slot_in_content || '';
        }
        if ('adsense_slot_end_of_post' in body) {
            settingsToSave['analytics.adsense_slot_end_of_post'] = body.adsense_slot_end_of_post || '';
        }
        if ('adsense_slot_after_cta' in body) {
            settingsToSave['analytics.adsense_slot_after_cta'] = body.adsense_slot_after_cta || '';
        }
        if ('admob_app_id' in body) {
            settingsToSave['analytics.admob_app_id'] = body.admob_app_id || '';
        }
        if ('admob_banner_id' in body) {
            settingsToSave['analytics.admob_banner_id'] = body.admob_banner_id || '';
        }
        if ('admob_interstitial_id' in body) {
            settingsToSave['analytics.admob_interstitial_id'] = body.admob_interstitial_id || '';
        }
        if ('admob_sticky_id' in body) {
            settingsToSave['analytics.admob_sticky_id'] = body.admob_sticky_id || '';
        }
        if ('admob_in_content_id' in body) {
            settingsToSave['analytics.admob_in_content_id'] = body.admob_in_content_id || '';
        }
        // Manual banner settings
        if ('manual_banner_image_url' in body) {
            settingsToSave['analytics.manual_banner_image_url'] = body.manual_banner_image_url || '';
        }
        if ('manual_banner_target_url' in body) {
            settingsToSave['analytics.manual_banner_target_url'] = body.manual_banner_target_url || '';
        }
        if ('manual_banner_enabled' in body) {
            settingsToSave['analytics.manual_banner_enabled'] = body.manual_banner_enabled || false;
        }

        const success = await settingsService.setMany(settingsToSave);

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to save settings' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, settings: body });
    } catch (error) {
        console.error('Error saving analytics settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
