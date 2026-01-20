import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/admin/feeds/[id]/clear-duplicates
 * Clear duplicate tracking records for a specific feed and reset counters
 * Allows re-processing of previously processed URLs
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const feedId = resolvedParams.id;

        // Verify admin access
        const supabase = await createRouteClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id as string)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Use admin client for operations
        const adminClient = createAdminClient();

        // Verify the feed exists
        const { data: feed, error: feedError } = await adminClient
            .from('rss_feeds')
            .select('id, name')
            .eq('id', feedId)
            .single();

        if (feedError || !feed) {
            return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
        }

        // Collect all entity IDs to delete from duplicate_tracking
        const entityIdsToDelete: string[] = [];

        // Get posts created from this feed
        const { data: feedPosts } = await adminClient
            .from('posts')
            .select('id')
            .eq('source_feed_id', feedId);

        if (feedPosts && feedPosts.length > 0) {
            entityIdsToDelete.push(...feedPosts.map(p => p.id));
        }

        // Get opportunities created from this feed
        const { data: feedOpportunities } = await adminClient
            .from('opportunities')
            .select('id')
            .eq('feed_id', feedId);

        if (feedOpportunities && feedOpportunities.length > 0) {
            entityIdsToDelete.push(...feedOpportunities.map(o => o.id));
        }

        let deletedCount = 0;

        // Delete duplicate_tracking records by feed_id (for records that have it set)
        const { error: deleteByFeedError } = await adminClient
            .from('duplicate_tracking')
            .delete()
            .eq('feed_id', feedId);

        if (deleteByFeedError) {
            await logger.warning('Error deleting by feed_id', {
                feed_id: feedId,
                error: deleteByFeedError.message
            });
        }

        // Delete duplicate_tracking records by entity_id (for all matching posts/opportunities)
        if (entityIdsToDelete.length > 0) {
            const { error: deleteByEntityError } = await adminClient
                .from('duplicate_tracking')
                .delete()
                .in('entity_id', entityIdsToDelete);

            if (deleteByEntityError) {
                await logger.warning('Error deleting by entity_id', {
                    feed_id: feedId,
                    error: deleteByEntityError.message
                });
            }
        }

        // Reset the feed counters and url_list_offset to 0
        const { error: resetError } = await adminClient
            .from('rss_feeds')
            .update({
                total_processed: 0,
                total_published: 0,
                url_list_offset: 0
            })
            .eq('id', feedId);

        if (resetError) {
            await logger.warning('Error resetting feed counters', {
                feed_id: feedId,
                error: resetError.message
            });
        }

        await logger.info('Feed tracking cleared and counters reset', {
            feed_id: feedId,
            feed_name: feed.name,
            posts_found: feedPosts?.length || 0,
            opportunities_found: feedOpportunities?.length || 0,
            url_list_offset_reset: true,
            user_id: user.id
        });

        return NextResponse.json({
            success: true,
            message: 'Duplicate tracking cleared, counters and URL list offset reset to 0'
        });
    } catch (error) {
        await logger.error('Error clearing duplicates', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
