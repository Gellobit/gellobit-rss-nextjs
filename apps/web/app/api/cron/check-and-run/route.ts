import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { rssProcessorService } from '@/lib/services/rss-processor.service';
import { logger } from '@/lib/utils/logger';

/**
 * Visitor-triggered Cron Endpoint
 *
 * This endpoint is called on site visits to check if cron tasks should run.
 * It implements debouncing to prevent excessive execution.
 *
 * Works alongside Vercel Cron:
 * - Vercel Cron: Guaranteed execution at fixed intervals (hourly)
 * - Visitor-triggered: More frequent execution during active periods
 *
 * @route POST /api/cron/check-and-run
 */

// Minimum minutes between visitor-triggered cron runs
const DEFAULT_MIN_INTERVAL_MINUTES = 5;

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const supabase = createAdminClient();

        // Get cron settings from database
        const { data: settings } = await supabase
            .from('system_settings')
            .select('key, value')
            .in('key', [
                'cron.last_visitor_triggered_run',
                'cron.visitor_triggered_enabled',
                'cron.visitor_triggered_min_interval'
            ]);

        // Parse settings with JSON.parse for stored values
        const settingsMap: Record<string, any> = {};
        for (const row of settings || []) {
            let value = row.value;
            if (typeof value === 'string') {
                try {
                    value = JSON.parse(value);
                } catch {
                    // Keep as string if not valid JSON
                }
            }
            settingsMap[row.key] = value;
        }

        const enabledValue = settingsMap['cron.visitor_triggered_enabled'];
        const isEnabled = enabledValue !== undefined ? enabledValue : true;
        const minIntervalMinutes = settingsMap['cron.visitor_triggered_min_interval'] || DEFAULT_MIN_INTERVAL_MINUTES;
        const lastRunStr = settingsMap['cron.last_visitor_triggered_run'] as string | null;

        // Check if visitor-triggered cron is enabled
        if (!isEnabled) {
            return NextResponse.json({
                triggered: false,
                reason: 'visitor_triggered_cron_disabled',
            });
        }

        // Check debounce - has enough time passed since last run?
        const now = new Date();
        const minIntervalMs = minIntervalMinutes * 60 * 1000;

        if (lastRunStr) {
            const lastRun = new Date(lastRunStr);
            const timeSinceLastRun = now.getTime() - lastRun.getTime();

            if (timeSinceLastRun < minIntervalMs) {
                const nextRunIn = Math.ceil((minIntervalMs - timeSinceLastRun) / 1000);
                return NextResponse.json({
                    triggered: false,
                    reason: 'debounce',
                    last_run: lastRunStr,
                    next_run_in_seconds: nextRunIn,
                });
            }
        }

        // Update last run time BEFORE processing to prevent race conditions
        await supabase
            .from('system_settings')
            .upsert({
                key: 'cron.last_visitor_triggered_run',
                value: now.toISOString(),
                updated_at: now.toISOString(),
            }, {
                onConflict: 'key',
            });

        await logger.info('Visitor-triggered cron started', {
            trigger: 'visitor',
            last_run: lastRunStr,
            min_interval_minutes: minIntervalMinutes,
        });

        // Process feeds (this checks each feed's individual interval)
        const results = await rssProcessorService.processAllFeeds();

        const executionTime = Date.now() - startTime;

        // Aggregate results
        const summary = {
            total_feeds_processed: results.length,
            successful_feeds: results.filter(r => r.success).length,
            failed_feeds: results.filter(r => !r.success).length,
            total_items_processed: results.reduce((sum, r) => sum + r.itemsProcessed, 0),
            total_opportunities_created: results.reduce((sum, r) => sum + r.opportunitiesCreated, 0),
            total_posts_created: results.reduce((sum, r) => sum + r.postsCreated, 0),
            total_duplicates_skipped: results.reduce((sum, r) => sum + r.duplicatesSkipped, 0),
            total_ai_rejections: results.reduce((sum, r) => sum + r.aiRejections, 0),
            total_errors: results.reduce((sum, r) => sum + r.errors, 0),
            execution_time_ms: executionTime,
        };

        await logger.info('Visitor-triggered cron completed', {
            trigger: 'visitor',
            ...summary,
        });

        return NextResponse.json({
            triggered: true,
            summary,
        });
    } catch (error) {
        const executionTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        await logger.error('Visitor-triggered cron failed', {
            trigger: 'visitor',
            error: errorMessage,
            execution_time_ms: executionTime,
        });

        return NextResponse.json({
            triggered: false,
            reason: 'error',
            error: errorMessage,
        }, { status: 500 });
    }
}

/**
 * GET method for status check
 */
export async function GET() {
    try {
        const supabase = createAdminClient();

        const { data: settings } = await supabase
            .from('system_settings')
            .select('key, value')
            .in('key', [
                'cron.last_visitor_triggered_run',
                'cron.visitor_triggered_enabled',
                'cron.visitor_triggered_min_interval'
            ]);

        // Parse settings with JSON.parse for stored values
        const settingsMap: Record<string, any> = {};
        for (const row of settings || []) {
            let value = row.value;
            if (typeof value === 'string') {
                try {
                    value = JSON.parse(value);
                } catch {
                    // Keep as string if not valid JSON
                }
            }
            settingsMap[row.key] = value;
        }

        const enabledValue = settingsMap['cron.visitor_triggered_enabled'];

        return NextResponse.json({
            enabled: enabledValue !== undefined ? enabledValue : true,
            min_interval_minutes: settingsMap['cron.visitor_triggered_min_interval'] || DEFAULT_MIN_INTERVAL_MINUTES,
            last_run: settingsMap['cron.last_visitor_triggered_run'] || null,
        });
    } catch (error) {
        return NextResponse.json({
            error: 'Failed to get cron status',
        }, { status: 500 });
    }
}
