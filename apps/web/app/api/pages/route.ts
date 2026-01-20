// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/utils/supabase-admin';

// GET - List published pages (public endpoint)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const footer = searchParams.get('footer') === 'true';
        const menu = searchParams.get('menu') === 'true';

        const adminSupabase = createAdminClient();

        let query = adminSupabase
            .from('pages')
            .select('id, title, slug, featured_image_url, show_in_footer, show_in_menu, sort_order, linked_opportunity_type')
            .eq('status', 'published')
            .order('sort_order', { ascending: true });

        if (footer) {
            query = query.eq('show_in_footer', true);
        }

        if (menu) {
            query = query.eq('show_in_menu', true);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching pages:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ pages: data });
    } catch (error) {
        console.error('Pages API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
