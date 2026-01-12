import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { RSSProcessorService } from '@/lib/services/rss-processor.service';

/**
 * POST /api/admin/feeds/[id]/sync
 * Trigger manual sync for a specific RSS feed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // Verify admin authentication
    const supabase = await createRouteClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id as string)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const feedId = resolvedParams.id;

    // Process the feed
    const rssProcessorService = RSSProcessorService.getInstance();
    const result = await rssProcessorService.processFeed(feedId);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to sync feed', details: result.errors },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error: any) {
    console.error('Error syncing feed:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
