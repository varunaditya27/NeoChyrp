/**
 * Supabase Storage helpers for media assets.
 * - Uses service role key for server-side privileged operations (upload).
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const MEDIA_BUCKET = 'media';

export function createSupabaseServiceClient() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Supabase service credentials missing (check NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY).');
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

export function publicAssetUrl(path: string) {
  const url = SUPABASE_URL.replace(/\/$/, '') + `/storage/v1/object/public/${MEDIA_BUCKET}/${encodeURI(path)}`;
  return url;
}
