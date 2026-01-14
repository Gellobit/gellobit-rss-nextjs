import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';

// GET - Get user's favorites
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

        const adminSupabase = createAdminClient();

        // Get favorites with opportunity details
        const { data, error, count } = await adminSupabase
            .from('user_favorites')
            .select(`
                id,
                created_at,
                opportunity:opportunities(
                    id,
                    slug,
                    title,
                    excerpt,
                    opportunity_type,
                    featured_image_url,
                    deadline,
                    prize_value,
                    status,
                    published_at
                )
            `, { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching favorites:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Filter out any favorites where opportunity was deleted or unpublished
        const validFavorites = data?.filter(f => f.opportunity && (f.opportunity as any).status === 'published') || [];

        return NextResponse.json({
            favorites: validFavorites,
            total: count,
            limit,
            offset,
        });
    } catch (error) {
        console.error('Get favorites error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Add to favorites
export async function POST(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { opportunity_id } = body;

        if (!opportunity_id) {
            return NextResponse.json(
                { error: 'Opportunity ID is required' },
                { status: 400 }
            );
        }

        const adminSupabase = createAdminClient();

        // Verify opportunity exists and is published
        const { data: opportunity } = await adminSupabase
            .from('opportunities')
            .select('id')
            .eq('id', opportunity_id)
            .eq('status', 'published')
            .single();

        if (!opportunity) {
            return NextResponse.json(
                { error: 'Opportunity not found' },
                { status: 404 }
            );
        }

        // Add to favorites
        const { data, error } = await adminSupabase
            .from('user_favorites')
            .insert({
                user_id: user.id,
                opportunity_id,
            })
            .select()
            .single();

        if (error) {
            // Check if already favorited
            if (error.code === '23505') { // Unique violation
                return NextResponse.json(
                    { error: 'Already in favorites' },
                    { status: 400 }
                );
            }
            console.error('Error adding favorite:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ favorite: data }, { status: 201 });
    } catch (error) {
        console.error('Add favorite error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - Remove from favorites
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const opportunity_id = searchParams.get('opportunity_id');

        if (!opportunity_id) {
            return NextResponse.json(
                { error: 'Opportunity ID is required' },
                { status: 400 }
            );
        }

        const adminSupabase = createAdminClient();

        const { error } = await adminSupabase
            .from('user_favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('opportunity_id', opportunity_id);

        if (error) {
            console.error('Error removing favorite:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Remove favorite error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
