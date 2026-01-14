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

        // Fetch personalization settings
        const appLogoUrl = await settingsService.get('personalization.app_logo_url');
        const appName = await settingsService.get('personalization.app_name');

        const settings = {
            app_logo_url: appLogoUrl || null,
            app_name: appName || 'GelloBit',
        };

        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Error fetching personalization settings:', error);
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

        // Save personalization settings
        const settingsToSave: Record<string, any> = {};

        if ('app_logo_url' in body) {
            settingsToSave['personalization.app_logo_url'] = body.app_logo_url;
        }
        if ('app_name' in body) {
            settingsToSave['personalization.app_name'] = body.app_name || 'GelloBit';
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
        console.error('Error saving personalization settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
