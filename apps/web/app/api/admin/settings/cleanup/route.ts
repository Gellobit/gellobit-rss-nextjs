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

        // Fetch cleanup settings from database
        const daysAfterDeadline = await settingsService.get('cleanup.days_after_deadline');
        const maxAgeByType = await settingsService.get('cleanup.max_age_by_type');

        return NextResponse.json({
            settings: {
                days_after_deadline: daysAfterDeadline,
                max_age_by_type: maxAgeByType,
            },
        });
    } catch (error) {
        console.error('Error fetching cleanup settings:', error);
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

        // Validate input
        if (typeof body.days_after_deadline !== 'number' || body.days_after_deadline < 0) {
            return NextResponse.json(
                { error: 'Invalid days_after_deadline value' },
                { status: 400 }
            );
        }

        if (!body.max_age_by_type || typeof body.max_age_by_type !== 'object') {
            return NextResponse.json(
                { error: 'Invalid max_age_by_type value' },
                { status: 400 }
            );
        }

        // Save settings to database
        const settingsToSave: Record<string, any> = {
            'cleanup.days_after_deadline': body.days_after_deadline,
            'cleanup.max_age_by_type': body.max_age_by_type,
        };

        const success = await settingsService.setMany(settingsToSave);

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to save settings' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            settings: {
                days_after_deadline: body.days_after_deadline,
                max_age_by_type: body.max_age_by_type,
            },
        });
    } catch (error) {
        console.error('Error saving cleanup settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
