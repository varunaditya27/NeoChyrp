import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { requirePermission } from '@/src/lib/permissions';
import { rateLimit } from '@/src/lib/security/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await requirePermission(req, 'comment:moderate');
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0';
  if (!rateLimit('moderate:'+ip, { capacity: 20, refillPerSec: 0.2 })) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  const { id, action } = await req.json();
    if (!id || !action) return NextResponse.json({ error: 'Missing id/action' }, { status: 400 });
    const map: Record<string,string> = { approve:'APPROVED', spam:'SPAM', delete:'DELETED' };
    if (!map[action]) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    const comment = await prisma.comment.update({ where:{ id }, data:{ status: map[action] as any } });
    return NextResponse.json({ data: comment });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
