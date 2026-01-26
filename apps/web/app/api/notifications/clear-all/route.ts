import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';

// DELETE /api/notifications/clear-all - Delete all notifications for the user
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error, count } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', user.id);

        if (error) {
            console.error('Error clearing all notifications:', error);
            return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            deletedCount: count || 0,
        });
    } catch (error) {
        console.error('Error in clear-all DELETE:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
