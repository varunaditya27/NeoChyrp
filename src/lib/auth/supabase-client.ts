/**
 * Browser Supabase client (use inside client components only).
 * - Handles realtime (likes, comments updates) later.
 */
// Using supabase-js client directly (simpler scaffold; replace with @supabase/ssr helpers later if desired)
import { createClient } from '@supabase/supabase-js';

export function createSupabaseBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
