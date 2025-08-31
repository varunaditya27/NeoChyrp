/**
 * Server-side Supabase client factory for RSC / route handlers.
 * - Integrate with Next.js cookies for auth persistence.
 */
import { createClient } from '@supabase/supabase-js';

export function createSupabaseServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
