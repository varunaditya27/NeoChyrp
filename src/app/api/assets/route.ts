import { NextResponse } from 'next/server';

import { getUserFromBearer } from '@/src/lib/auth/currentUser';
import { prisma } from '@/src/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getUserFromBearer(req.headers.get('authorization'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const assets = await prisma.asset.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json({ data: assets });
}
