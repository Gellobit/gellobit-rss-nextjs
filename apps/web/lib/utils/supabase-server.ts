import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '../types/database.types';

/**
 * Create Supabase client for Server Components and API Routes
 * Uses cookies for authentication
 *
 * @returns Supabase client with user context
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
}
