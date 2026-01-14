import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

// GET - Check if opportunities are favorited
export async function GET(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];

        if (ids.length === 0) {
            return NextResponse.json({ favorites: {} });
        }

        const adminSupabase = createAdminClient();

        const { data, error } = await adminSupabase
            .from('user_favorites')
            .select('opportunity_id')
            .eq('user_id', user.id)
            .in('opportunity_id', ids);

        if (error) {
            console.error('Error checking favorites:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Create a map of opportunity_id -> true
        const favoritesMap: Record<string, boolean> = {};
        data?.forEach(f => {
            favoritesMap[f.opportunity_id] = true;
        });

        return NextResponse.json({ favorites: favoritesMap });
    } catch (error) {
        console.error('Check favorites error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
