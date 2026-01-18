// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { settingsService } from '@/lib/services/settings.service';

// All personalization setting keys
const SETTING_KEYS = [
    'app_logo_url',
    'app_logo_footer_url',
    'app_name',
    'logo_spin_enabled',
    'logo_spin_duration',
    'custom_css',
    'hero_badge_text',
    'hero_title',
    'hero_title_highlight',
    'hero_subtitle',
    'hero_cta_primary',
    'hero_cta_secondary',
    'hero_background_color',
    'app_section_title',
    'app_section_subtitle',
    'app_playstore_url',
    'app_appstore_url',
    'app_mockup_image_url',
    'footer_tagline',
    'footer_explore_links',
    'footer_info_page_ids',
    'footer_social_links',
    'footer_bottom_left',
    'footer_bottom_right',
];

// Keys that need JSON parsing
const JSON_KEYS = ['footer_explore_links', 'footer_info_page_ids', 'footer_social_links'];

// Default values
const DEFAULTS: Record<string, any> = {
    app_name: 'GelloBit',
    logo_spin_enabled: false,
    logo_spin_duration: 6,
    hero_badge_text: 'New Platform 2.0 Available!',
    hero_title: 'Verified USA Opportunities',
    hero_title_highlight: 'just a click away.',
    hero_subtitle: 'Gellobit connects you with real giveaways, job fairs, and scholarships. No scams, just value verified daily by experts.',
    hero_cta_primary: 'Explore Feed Now',
    hero_cta_secondary: 'View Pro Plan',
    hero_background_color: '#ffffff',
    app_section_title: 'Carry opportunities in your pocket.',
    app_section_subtitle: 'Download the mobile App and never miss a job fair or verified giveaway by not being at your PC.',
    footer_tagline: 'Empowering the USA community through verified opportunities and valuable content since 2025.',
    footer_bottom_left: '© 2026 Gellobit.com. All rights reserved.',
    footer_bottom_right: 'Developed with ❤️ for USA',
};

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

        // Fetch all personalization settings
        const values = await Promise.all(
            SETTING_KEYS.map(key => settingsService.get(`personalization.${key}`))
        );

        const settings: Record<string, any> = {};
        SETTING_KEYS.forEach((key, index) => {
            const value = values[index];
            if (JSON_KEYS.includes(key)) {
                // Value might already be parsed by settingsService, or it could be a string
                if (Array.isArray(value)) {
                    settings[key] = value;
                } else if (typeof value === 'string' && value) {
                    try {
                        settings[key] = JSON.parse(value);
                    } catch {
                        settings[key] = [];
                    }
                } else {
                    settings[key] = [];
                }
            } else {
                // Only use default if value is null/undefined/empty string
                const hasValue = value !== null && value !== undefined && value !== '';
                settings[key] = hasValue ? value : (DEFAULTS[key] ?? null);
            }
        });

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

        SETTING_KEYS.forEach(key => {
            if (key in body) {
                if (JSON_KEYS.includes(key)) {
                    settingsToSave[`personalization.${key}`] = JSON.stringify(body[key] || []);
                } else {
                    settingsToSave[`personalization.${key}`] = body[key];
                }
            }
        });

        const success = await settingsService.setMany(settingsToSave);

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to save settings' },
                { status: 500 }
            );
        }

        // Revalidate cache so changes appear on homepage immediately
        revalidateTag('personalization');

        return NextResponse.json({ success: true, settings: body });
    } catch (error) {
        console.error('Error saving personalization settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
