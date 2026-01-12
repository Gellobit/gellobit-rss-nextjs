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
    const { id, provider, api_key, model, is_active, max_tokens, temperature, rate_limit_per_hour } = body;

    if (!provider || !api_key || !model) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If setting as active, deactivate ALL others first
    if (is_active) {
      await adminSupabase
        .from('ai_settings')
        .update({ is_active: false })
        .eq('is_active', true);
    }

    let setting, error;

    if (id) {
      // Update existing provider
      const result = await adminSupabase
        .from('ai_settings')
        .update({
          provider,
          api_key,
          model,
          is_active: is_active || false,
          max_tokens: max_tokens || 1500,
          temperature: temperature || 0.1,
          rate_limit_per_hour: rate_limit_per_hour || 100,
        })
        .eq('id', id)
        .select('id, provider, model, api_key, is_active, max_tokens, temperature, rate_limit_per_hour')
        .single();

      setting = result.data;
      error = result.error;
    } else {
      // Insert new provider
      const result = await adminSupabase
        .from('ai_settings')
        .insert({
          provider,
          api_key,
          model,
          is_active: is_active || false,
          max_tokens: max_tokens || 1500,
          temperature: temperature || 0.1,
          rate_limit_per_hour: rate_limit_per_hour || 100,
        })
        .select('id, provider, model, api_key, is_active, max_tokens, temperature, rate_limit_per_hour')
        .single();

      setting = result.data;
      error = result.error;
    }

    if (error) {
      await logger.error('Supabase error in AI settings', {
        error: JSON.stringify(error),
        provider,
        user_id: user.id,
      });
      throw error;
    }

    await logger.info('AI settings updated', {
      provider,
      is_active,
      user_id: user.id,
    });

    return NextResponse.json({ setting }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : JSON.stringify(error);

    await logger.error('Error updating AI settings', {
      error: errorMessage,
      details: errorDetails,
    });

    console.error('Full error:', error);

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
