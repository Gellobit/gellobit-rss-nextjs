import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';

// PUT /api/notifications/read-all - Mark all notifications as read
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error, count } = await supabase
            .from('notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) {
            console.error('Error marking all notifications as read:', error);
            return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            updatedCount: count || 0,
        });
    } catch (error) {
        console.error('Error in read-all PUT:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
