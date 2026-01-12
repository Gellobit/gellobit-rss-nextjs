import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/utils/supabase-server';
import { aiService } from '@/lib/services/ai.service';
import { logger } from '@/lib/utils/logger';
import type { AIProvider } from '@/lib/types/database.types';

/**
 * POST /api/admin/ai-settings/test
 * Test AI provider connection
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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

    const body = await request.json();
    const { provider, api_key, model } = body;

    if (!provider || !api_key || !model) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Test the provider
    const result = await aiService.testProvider(
      provider as AIProvider,
      api_key,
      model
    );

    await logger.info('AI provider test completed', {
      provider,
      success: result.success,
      user_id: user.id,
    });

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    await logger.error('Error testing AI provider', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
