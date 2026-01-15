import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

// GET - List all users with filters
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

        // Parse query params
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');
        const role = searchParams.get('role');
        const status = searchParams.get('status');
        const membership = searchParams.get('membership');
        const search = searchParams.get('search');

        // Build query
        let query = adminSupabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (role) {
            query = query.eq('role', role);
        }

        if (status) {
            query = query.eq('status', status);
        }

        if (membership) {
            query = query.eq('membership_type', membership);
        }

        if (search) {
            query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching users:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get stats
        const { data: statsData } = await adminSupabase
            .from('profiles')
            .select('role, status, membership_type');

        const stats = {
            total: statsData?.length || 0,
            admins: statsData?.filter(u => u.role === 'admin').length || 0,
            users: statsData?.filter(u => u.role === 'user').length || 0,
            active: statsData?.filter(u => u.status === 'active' || !u.status).length || 0,
            suspended: statsData?.filter(u => u.status === 'suspended').length || 0,
            free: statsData?.filter(u => u.membership_type === 'free' || !u.membership_type).length || 0,
            premium: statsData?.filter(u => u.membership_type && u.membership_type !== 'free').length || 0,
        };

        return NextResponse.json({
            users: data,
            total: count,
            limit,
            offset,
            stats,
        });
    } catch (error) {
        console.error('Users API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
