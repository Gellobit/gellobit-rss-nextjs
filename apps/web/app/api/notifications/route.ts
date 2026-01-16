import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';

// GET /api/notifications - List user's notifications
export async function GET(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');
        const unreadOnly = searchParams.get('unread') === 'true';

        let query = supabase
            .from('notifications')
            .select(`
                id,
                type,
                title,
                message,
                opportunity_id,
                metadata,
                is_read,
                read_at,
                created_at,
                expires_at,
                opportunities:opportunity_id (
                    id,
                    title,
                    slug,
                    opportunity_type,
                    featured_image_url
                )
            `)
            .eq('user_id', user.id)
            .or('expires_at.is.null,expires_at.gt.now()')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        const { data: notifications, error } = await query;

        if (error) {
            console.error('Error fetching notifications:', error);
            return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
        }

        // Get unread count
        const { count: unreadCount } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false)
            .or('expires_at.is.null,expires_at.gt.now()');

        return NextResponse.json({
            notifications,
            unreadCount: unreadCount || 0,
        });
    } catch (error) {
        console.error('Error in notifications GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/notifications - Delete all read notifications
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', user.id)
            .eq('is_read', true);

        if (error) {
            console.error('Error deleting notifications:', error);
            return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in notifications DELETE:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
