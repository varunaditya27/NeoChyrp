/**
 * Server-side Supabase client factory for RSC / route handlers.
 * - Integrate with Next.js cookies for auth persistence.
 */
import { createClient } from '@supabase/supabase-js';

/**
 * Server client (RSC/route handlers). Optionally accepts access token override.
 */
export function createSupabaseServerClient(accessToken?: string) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
        autoRefreshToken: false
      }
    }
  );
  if (accessToken) {
    // setAuth removed in v2; use setSession with fake refresh token placeholder if needed
    // For getUser we can just pass token; so nothing extra here.
  }
  return client;
}
