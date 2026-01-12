import { createRouteClient } from './supabase-route';
import { createAdminClient } from './supabase-admin';
import { NextResponse } from 'next/server';

/**
 * Check if the authenticated user is an admin
 * Returns the user if admin, otherwise returns an error NextResponse
 */
export async function requireAdmin() {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null,
    };
  }

  // Use admin client to check role (avoids type issues)
  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      user: null,
    };
  }

  return {
    error: null,
    user,
  };
}
