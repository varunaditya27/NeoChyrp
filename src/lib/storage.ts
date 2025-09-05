/**
 * Supabase Storage helpers for media assets.
 * - Uses service role key for server-side privileged operations (upload).
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Allow overriding the bucket via env (no spaces recommended). Default: 'media'
export const MEDIA_BUCKET = (process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'media').trim();

export function createSupabaseServiceClient() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Supabase service credentials missing (check NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY).');
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

export function publicAssetUrl(path: string) {
  const base = SUPABASE_URL.replace(/\/$/, '');
  // encode each segment individually (bucket names should not contain spaces, but defensively encode)
  const bucket = encodeURIComponent(MEDIA_BUCKET);
  const objectPath = path.split('/').map(encodeURIComponent).join('/');
  return `${base}/storage/v1/object/public/${bucket}/${objectPath}`;
}
