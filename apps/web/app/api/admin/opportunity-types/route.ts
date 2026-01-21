// @ts-nocheck - Supabase type inference issues with Next.js 15 route client
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { opportunityTypesService } from '@/lib/services/opportunity-types.service';

/**
 * GET /api/admin/opportunity-types
 * List all opportunity types
 */
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

        // Check if we should include inactive types
        const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true';

        const types = await opportunityTypesService.getAll(includeInactive);

        return NextResponse.json({ types }, { status: 200 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/admin/opportunity-types
 * Create a new opportunity type
 */
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
        const { name, slug, description, color, icon, is_active, display_order } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Generate slug from name if not provided
        const finalSlug = slug || opportunityTypesService.generateSlug(name);

        if (!opportunityTypesService.isValidSlug(finalSlug)) {
            return NextResponse.json({
                error: 'Invalid slug format. Use lowercase letters, numbers, and underscores only. Must start with a letter.'
            }, { status: 400 });
        }

        const type = await opportunityTypesService.create({
            name,
            slug: finalSlug,
            description,
            color,
            icon,
            is_active,
            display_order,
        });

        return NextResponse.json({ type }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating opportunity type:', error);
        return NextResponse.json({
            error: error.message || 'Failed to create opportunity type'
        }, { status: 400 });
    }
}
