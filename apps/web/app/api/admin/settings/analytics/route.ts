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
        const adsenseClientId = await settingsService.get('analytics.adsense_client_id');
        const adsenseSlotId = await settingsService.get('analytics.adsense_slot_id');
        const admobAppId = await settingsService.get('analytics.admob_app_id');
        const admobBannerId = await settingsService.get('analytics.admob_banner_id');

        const settings = {
            google_analytics_id: googleAnalyticsId || '',
            adsense_client_id: adsenseClientId || '',
            adsense_slot_id: adsenseSlotId || '',
            admob_app_id: admobAppId || '',
            admob_banner_id: admobBannerId || '',
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
        if ('admob_app_id' in body) {
            settingsToSave['analytics.admob_app_id'] = body.admob_app_id || '';
        }
        if ('admob_banner_id' in body) {
            settingsToSave['analytics.admob_banner_id'] = body.admob_banner_id || '';
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
