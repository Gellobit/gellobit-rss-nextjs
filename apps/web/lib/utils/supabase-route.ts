import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/database.types';

/**
 * Create Supabase client for API Route Handlers
 * Use this in /app/api/* routes
 */
export async function createRouteClient() {
  const cookieStore = await cookies();
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore });
}
