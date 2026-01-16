import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';

// GET /api/notifications/count - Get unread notification count
export async function GET(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false)
            .or('expires_at.is.null,expires_at.gt.now()');

        if (error) {
            console.error('Error fetching notification count:', error);
            return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 });
        }

        return NextResponse.json({ count: count || 0 });
    } catch (error) {
        console.error('Error in count GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
