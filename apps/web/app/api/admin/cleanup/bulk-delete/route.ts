import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { logger } from '@/lib/utils/logger';
import type { OpportunityType } from '@/lib/types/database.types';

const VALID_OPPORTUNITY_TYPES: OpportunityType[] = [
    'contest',
    'giveaway',
    'sweepstakes',
    'dream_job',
    'get_paid_to',
    'instant_win',
    'job_fair',
    'scholarship',
    'volunteer',
    'free_training',
    'promo',
];

/**
 * GET /api/admin/cleanup/bulk-delete?type=contest
 * Get count of opportunities to be deleted
 */
export async function GET(request: NextRequest) {
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

        const opportunityType = request.nextUrl.searchParams.get('type') as OpportunityType;

        if (!opportunityType || !VALID_OPPORTUNITY_TYPES.includes(opportunityType)) {
            return NextResponse.json({ error: 'Invalid opportunity type' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Count opportunities of this type
        const { count: opportunityCount, error: countError } = await adminClient
            .from('opportunities')
            .select('*', { count: 'exact', head: true })
            .eq('opportunity_type', opportunityType);

        if (countError) {
            throw countError;
        }

        // Count affected feeds (only opportunity feeds, not blog post feeds)
        const { data: feeds, error: feedsError } = await adminClient
            .from('rss_feeds')
            .select('id, name, total_processed, total_published')
            .eq('opportunity_type', opportunityType)
            .eq('output_type', 'opportunity');

        if (feedsError) {
            throw feedsError;
        }

        // Count processing history entries
        const { count: historyCount, error: historyError } = await adminClient
            .from('processing_history')
            .select('*', { count: 'exact', head: true })
            .in('feed_id', feeds?.map(f => f.id) || []);

        if (historyError) {
            throw historyError;
        }

        return NextResponse.json({
            opportunity_type: opportunityType,
            opportunities_count: opportunityCount || 0,
            feeds_count: feeds?.length || 0,
            feeds: feeds || [],
            processing_history_count: historyCount || 0,
        });
    } catch (error) {
        console.error('Error getting bulk delete info:', error);
        return NextResponse.json(
            { error: 'Failed to get bulk delete info' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/cleanup/bulk-delete
 * Delete all opportunities of a specific type and reset associated feeds
 */
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const {
            opportunity_type,
            confirmation_type,
            confirmed_understand
        } = body;

        // Validate opportunity type
        if (!opportunity_type || !VALID_OPPORTUNITY_TYPES.includes(opportunity_type)) {
            return NextResponse.json({ error: 'Invalid opportunity type' }, { status: 400 });
        }

        // Triple verification
        if (confirmation_type !== opportunity_type) {
            return NextResponse.json({
                error: 'Confirmation type does not match. Please type the exact opportunity type.'
            }, { status: 400 });
        }

        if (!confirmed_understand) {
            return NextResponse.json({
                error: 'You must confirm that you understand this action cannot be undone.'
            }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Get feeds of this type before deletion (only opportunity feeds, not blog post feeds)
        const { data: feeds } = await adminClient
            .from('rss_feeds')
            .select('id, name, total_processed, total_published')
            .eq('opportunity_type', opportunity_type)
            .eq('output_type', 'opportunity');

        const feedIds = feeds?.map(f => f.id) || [];

        // Start deletion process
        let deletedOpportunities = 0;
        let deletedHistory = 0;
        let deletedDuplicates = 0;
        let resetFeeds = 0;

        // 1. Delete duplicate tracking entries for these opportunities
        const { data: opportunityIds } = await adminClient
            .from('opportunities')
            .select('id')
            .eq('opportunity_type', opportunity_type);

        if (opportunityIds && opportunityIds.length > 0) {
            const { count: dupCount } = await adminClient
                .from('duplicate_tracking')
                .delete()
                .in('opportunity_id', opportunityIds.map(o => o.id))
                .select('*', { count: 'exact', head: true });

            deletedDuplicates = dupCount || 0;
        }

        // 2. Delete processing history for affected feeds
        if (feedIds.length > 0) {
            const { count: histCount } = await adminClient
                .from('processing_history')
                .delete()
                .in('feed_id', feedIds)
                .select('*', { count: 'exact', head: true });

            deletedHistory = histCount || 0;
        }

        // 3. Delete all opportunities of this type
        const { count: oppCount, error: deleteError } = await adminClient
            .from('opportunities')
            .delete()
            .eq('opportunity_type', opportunity_type)
            .select('*', { count: 'exact', head: true });

        if (deleteError) {
            throw deleteError;
        }
        deletedOpportunities = oppCount || 0;

        // 4. Reset feed counters
        if (feedIds.length > 0) {
            const { error: resetError } = await adminClient
                .from('rss_feeds')
                .update({
                    total_processed: 0,
                    total_published: 0,
                    last_fetched: null,
                    last_error: null,
                    error_count: 0,
                })
                .in('id', feedIds);

            if (resetError) {
                await logger.warning('Failed to reset some feeds after bulk delete', {
                    opportunity_type,
                    error: resetError.message,
                });
            } else {
                resetFeeds = feedIds.length;
            }
        }

        // Log the bulk delete action
        await logger.info('Bulk delete completed', {
            opportunity_type,
            deleted_opportunities: deletedOpportunities,
            deleted_history: deletedHistory,
            deleted_duplicates: deletedDuplicates,
            reset_feeds: resetFeeds,
            performed_by: user.id,
        });

        return NextResponse.json({
            success: true,
            opportunity_type,
            deleted_opportunities: deletedOpportunities,
            deleted_processing_history: deletedHistory,
            deleted_duplicate_tracking: deletedDuplicates,
            reset_feeds: resetFeeds,
            feed_names: feeds?.map(f => f.name) || [],
        });
    } catch (error) {
        console.error('Error performing bulk delete:', error);
        await logger.error('Bulk delete failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return NextResponse.json(
            { error: 'Failed to perform bulk delete' },
            { status: 500 }
        );
    }
}
