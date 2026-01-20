import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { rssProcessorService } from '@/lib/services/rss-processor.service';

/**
 * POST /api/admin/feeds/[id]/reactivate
 * Reactivate a feed that was marked as error
 * Resets error count and sets status back to active
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createRouteClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id: feedId } = await params;

        if (!feedId) {
            return NextResponse.json({ error: 'Feed ID is required' }, { status: 400 });
        }

        const success = await rssProcessorService.reactivateFeed(feedId);

        if (!success) {
            return NextResponse.json({ error: 'Failed to reactivate feed' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Feed reactivated successfully',
        });
    } catch (error) {
        console.error('Error reactivating feed:', error);
        return NextResponse.json(
            { error: 'Failed to reactivate feed' },
            { status: 500 }
        );
    }
}
