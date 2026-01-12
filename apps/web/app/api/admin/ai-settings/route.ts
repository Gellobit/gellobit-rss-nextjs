// @ts-nocheck - Supabase type inference issues with Next.js 15 route client
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { logger } from '@/lib/utils/logger';
import { aiService } from '@/lib/services/ai.service';

/**
 * GET /api/admin/ai-settings
 * List all AI provider settings
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to check role (avoids type issues with route client)
    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { data: settings, error } = await adminSupabase
      .from('ai_settings')
      .select('id, provider, model, api_key, is_active, max_tokens, temperature, rate_limit_per_hour, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ settings: settings || [] }, { status: 200 });
  } catch (error) {
    await logger.error('Error fetching AI settings', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ai-settings
 * Create or update AI provider settings
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to check role (avoids type issues with route client)
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
    const { provider, api_key, model, is_active, max_tokens, temperature, rate_limit_per_hour } = body;

    if (!provider || !api_key || !model) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If setting as active, deactivate all others
    if (is_active) {
      await adminSupabase
        .from('ai_settings')
        .update({ is_active: false })
        .neq('provider', provider);
    }

    // Upsert setting
    const { data: setting, error } = await adminSupabase
      .from('ai_settings')
      .upsert({
        provider,
        api_key, // Will be encrypted by database trigger
        model,
        is_active: is_active || false,
        max_tokens: max_tokens || 4000,
        temperature: temperature || 0.7,
        rate_limit_per_hour: rate_limit_per_hour || 100,
      }, {
        onConflict: 'provider',
      })
      .select('id, provider, model, api_key, is_active, max_tokens, temperature, rate_limit_per_hour')
      .single();

    if (error) {
      throw error;
    }

    await logger.info('AI settings updated', {
      provider,
      is_active,
      user_id: user.id,
    });

    return NextResponse.json({ setting }, { status: 200 });
  } catch (error) {
    await logger.error('Error updating AI settings', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
