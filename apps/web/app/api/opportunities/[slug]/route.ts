import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { createRouteClient } from '@/lib/utils/supabase-route';

/**
 * GET /api/opportunities/[slug]
 * Protected API to get a single published opportunity by slug
 * Requires authentication - opportunities are private content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Verify user is authenticated
    const supabaseAuth = await createRouteClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const supabase = createAdminClient();

    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('slug', resolvedParams.slug)
      .eq('status', 'published')
      .single();

    if (error || !opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ opportunity });
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunity' },
      { status: 500 }
    );
  }
}
