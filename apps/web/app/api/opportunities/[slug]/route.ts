import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/utils/supabase-admin';

/**
 * GET /api/opportunities/[slug]
 * Public API to get a single published opportunity by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
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
