import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

import { prisma } from '@/src/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  (await cookies()).set('dev_user_id', userId, { path: '/', httpOnly: false });
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: 'Failed to switch user' }, { status: 500 });
  }
}
