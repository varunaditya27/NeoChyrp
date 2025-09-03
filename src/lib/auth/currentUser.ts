/**
 * Helper to resolve current authenticated user (Prisma user) from a bearer Supabase access token.
 * Falls back to null if invalid.
 */
import { createSupabaseServerClient } from '@/src/lib/auth/supabase-server';
import { prisma } from '@/src/lib/db';

export async function getUserFromBearer(authHeader: string | null) {
  if (!authHeader) return null;
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined;
  if (!token) return null;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  const email = data.user.email;
  if (!email) return null;
  return prisma.user.findUnique({ where: { email } });
}
