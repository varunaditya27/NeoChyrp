// Temporary development session mock until auth is wired.
// Returns first user as the current session user.
import { cookies } from 'next/headers';

import { prisma } from '@/src/lib/db';

export interface SessionUser { id: string; username: string; displayName: string; role: string; }
export interface Session { user: SessionUser };

export async function getDevSession(): Promise<Session | null> {
  try {
  const jar = await cookies();
  const selectedId = jar.get('dev_user_id')?.value;
    let user;
    if (selectedId) {
      user = await prisma.user.findUnique({ where: { id: selectedId }, select: { id: true, username: true, displayName: true, role: true } });
    }
    if (!user) {
      user = await prisma.user.findFirst({ select: { id: true, username: true, displayName: true, role: true } });
    }
    if (!user) return null;
    return { user };
  } catch {
    return null;
  }
}
