// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

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

        // Fetch all settings
        const { data: aiSettings } = await adminSupabase
            .from('ai_settings')
            .select('*')
            .single();

        const { data: feeds } = await adminSupabase
            .from('rss_feeds')
            .select('*');

        const exportData = {
            ai_settings: aiSettings,
            feeds: feeds,
            exported_at: new Date().toISOString(),
            version: '1.0.0',
        };

        return NextResponse.json({ settings: exportData });
    } catch (error) {
        console.error('Error exporting settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
