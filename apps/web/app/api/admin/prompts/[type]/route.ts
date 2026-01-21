// @ts-nocheck - Supabase type inference issues with Next.js 15 route client
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/utils/supabase-route';
import { createAdminClient } from '@/lib/utils/supabase-admin';
import { promptService } from '@/lib/services/prompt.service';

/**
 * GET /api/admin/prompts/[type]
 * Get prompt for a specific opportunity type
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const supabase = await createRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to check role
    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Next.js 15: await params before accessing
    const { type } = await params;

    // Use promptService to get prompt with proper source detection
    const result = await promptService.getPromptForDisplay(type);

    return NextResponse.json(
      {
        prompt: result.prompt,
        source: result.source,
        hasBuiltIn: result.hasBuiltIn,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching prompt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/prompts/[type]
 * Save custom prompt for an opportunity type
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const supabase = await createRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to check role
    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Next.js 15: await params before accessing
    const { type } = await params;
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid prompt text' },
        { status: 400 }
      );
    }

    // Save custom prompt (supports dynamic types)
    const result = await promptService.saveCustomPrompt(type, prompt);

    if (!result.success) {
      console.error('Prompt save error:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to save prompt' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Prompt saved successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving prompt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/prompts/[type]
 * Delete custom prompt and revert to default
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const supabase = await createRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to check role
    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Next.js 15: await params before accessing
    const { type } = await params;

    // Delete custom prompt (supports dynamic types)
    const result = await promptService.deleteCustomPrompt(type);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete prompt' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Prompt reset to default' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
