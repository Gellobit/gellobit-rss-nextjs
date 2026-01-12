import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '../types/database.types';

/**
 * Create Supabase client for Server Components and API Routes
 * Uses cookies for authentication
 *
 * @returns Supabase client with user context
 */
export function createServerClient() {
  const cookieStore = cookies();

  return createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
}
