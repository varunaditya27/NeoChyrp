import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/src/lib/auth/supabase-server';
import { prisma } from '@/src/lib/db';

/**
 * Sync authenticated Supabase user into Prisma User table.
 * - Requires Authorization: Bearer <access_token> header from client.
 * - First ever user promoted to OWNER; others default USER.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined;
  if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  const sUser = data.user;

  // Ensure a deterministic username.
  const baseUsername = (sUser.user_metadata?.preferred_username || sUser.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9_]+/g, '_').slice(0, 30) || 'user';

  // Attempt to find by email; fallback to using sUser.id metadata.
  let existing = sUser.email ? await prisma.user.findUnique({ where: { email: sUser.email } }) : null;

  const totalUsers = await prisma.user.count();
  const isFirst = totalUsers === 0;

  if (!existing) {
    // Guarantee unique username by appending numeric suffix if collision.
    let username = baseUsername;
    let c = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${c}`.slice(0, 32);
      c += 1;
      if (c > 50) break; // safety
    }
    existing = await prisma.user.create({
      data: {
        email: sUser.email || `${sUser.id}@placeholder.local`,
        username,
        displayName: sUser.user_metadata?.full_name || sUser.email || username,
        role: isFirst ? 'OWNER' : 'USER'
      }
    });
  } else {
    // Update display name if changed.
    const newDisplay = sUser.user_metadata?.full_name || existing.displayName;
    if (newDisplay !== existing.displayName) {
      existing = await prisma.user.update({ where: { id: existing.id }, data: { displayName: newDisplay } });
    }
  }

  return NextResponse.json({ data: { id: existing.id, email: existing.email, role: existing.role } });
}
