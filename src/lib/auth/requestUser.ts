import { verify } from 'jsonwebtoken';
import type { NextRequest } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getAuthTokenFromRequest } from '@/src/lib/auth/cookies';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface RequestUser {
  id: string;
  username: string;
  role: string;
  displayName: string;
  email: string;
}

export async function getRequestUser(req: NextRequest): Promise<RequestUser | null> {
  const token = getAuthTokenFromRequest(req);
  if (!token) return null;
  try {
    const decoded = verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, role: true, displayName: true, email: true }
    });
    return user || null;
  } catch {
    return null;
  }
}
