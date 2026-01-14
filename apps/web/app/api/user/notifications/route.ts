import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

// GET - Get user notification settings
export async function GET(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminSupabase = createAdminClient();

        // Get or create notification settings
        let { data: settings, error } = await adminSupabase
            .from('user_notification_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code === 'PGRST116') {
            // No settings found, create default
            const { data: newSettings, error: insertError } = await adminSupabase
                .from('user_notification_settings')
                .insert({ user_id: user.id })
                .select()
                .single();

            if (insertError) {
                console.error('Error creating notification settings:', insertError);
                return NextResponse.json({ error: insertError.message }, { status: 500 });
            }

            settings = newSettings;
        } else if (error) {
            console.error('Error fetching notification settings:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Get notification settings error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT - Update notification settings
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            email_new_opportunities,
            email_favorites_expiring,
            email_weekly_digest,
            email_membership_updates,
            push_enabled,
            push_new_opportunities,
            push_favorites_expiring,
            app_new_opportunities,
            app_favorites_expiring,
            opportunity_types,
            min_prize_value,
        } = body;

        const adminSupabase = createAdminClient();

        // Build update data
        const updateData: Record<string, any> = {};
        if (email_new_opportunities !== undefined) updateData.email_new_opportunities = email_new_opportunities;
        if (email_favorites_expiring !== undefined) updateData.email_favorites_expiring = email_favorites_expiring;
        if (email_weekly_digest !== undefined) updateData.email_weekly_digest = email_weekly_digest;
        if (email_membership_updates !== undefined) updateData.email_membership_updates = email_membership_updates;
        if (push_enabled !== undefined) updateData.push_enabled = push_enabled;
        if (push_new_opportunities !== undefined) updateData.push_new_opportunities = push_new_opportunities;
        if (push_favorites_expiring !== undefined) updateData.push_favorites_expiring = push_favorites_expiring;
        if (app_new_opportunities !== undefined) updateData.app_new_opportunities = app_new_opportunities;
        if (app_favorites_expiring !== undefined) updateData.app_favorites_expiring = app_favorites_expiring;
        if (opportunity_types !== undefined) updateData.opportunity_types = opportunity_types;
        if (min_prize_value !== undefined) updateData.min_prize_value = min_prize_value;

        // Upsert settings
        const { data, error } = await adminSupabase
            .from('user_notification_settings')
            .upsert({
                user_id: user.id,
                ...updateData,
            }, {
                onConflict: 'user_id',
            })
            .select()
            .single();

        if (error) {
            console.error('Error updating notification settings:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ settings: data });
    } catch (error) {
        console.error('Update notification settings error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
