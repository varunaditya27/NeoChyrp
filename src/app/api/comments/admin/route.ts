import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getRequestUser } from '@/src/lib/auth/requestUser';
import { isAdmin } from '@/src/lib/auth/adminAccess';

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req);
    if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const take = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const where: any = {};
    if (status && ['PENDING','APPROVED','SPAM','DELETED'].includes(status.toUpperCase())) where.status = status.toUpperCase();
    const comments = await prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      include: { post: { select: { id:true, title:true, slug:true } }, author: { select: { id:true, username:true, displayName:true } } }
    });
    return NextResponse.json({ success:true, comments });
  } catch (e:any) {
    return NextResponse.json({ error: e.message||'Error' }, { status:500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getRequestUser(req);
    if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id, action } = await req.json();
    if (!id || !action) return NextResponse.json({ error: 'Missing id/action' }, { status:400 });
    const map: Record<string,string> = { approve:'APPROVED', spam:'SPAM', delete:'DELETED' };
    if (!map[action]) return NextResponse.json({ error: 'Invalid action' }, { status:400 });
    const updated = await prisma.comment.update({ where:{ id }, data:{ status: map[action] as any } });
    return NextResponse.json({ success:true, comment: updated });
  } catch (e:any) {
    return NextResponse.json({ error: e.message||'Error' }, { status:500 });
  }
}
