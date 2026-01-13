import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/admin/feeds/export
 * Export all feeds as JSON
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminSupabase = createAdminClient();
    const { data: feeds, error } = await adminSupabase
      .from('rss_feeds')
      .select('name, url, opportunity_type, status, enable_scraping, enable_ai_processing, auto_publish, ai_provider, ai_model, quality_threshold, priority, cron_interval, fallback_featured_image_url, allow_republishing')
      .order('priority', { ascending: false });

    if (error) {
      throw error;
    }

    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      feeds_count: feeds?.length || 0,
      feeds: feeds || []
    };

    await logger.info('Feeds exported', {
      user_id: user.id,
      feeds_count: feeds?.length || 0
    });

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="feeds-export-${new Date().toISOString().split('T')[0]}.json"`
      }
    });
  } catch (error) {
    await logger.error('Error exporting feeds', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
