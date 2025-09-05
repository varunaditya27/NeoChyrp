import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { modulesService } from '@/src/lib/modules/service';
import { getRequestUser } from '@/src/lib/auth/requestUser';
import { isAdmin } from '@/src/lib/auth/adminAccess';

export async function GET(req: NextRequest, context: any) {
  const user = await getRequestUser(req);
  if (!user || !isAdmin(user)) return new NextResponse('Forbidden', { status:403 });
  const id = context?.params?.id;
  if (!id) return new NextResponse('Missing module id', { status:400 });
  const settings = await modulesService.getSettings(id);
  return NextResponse.json({ success:true, settings });
}

export async function PUT(req: NextRequest, context: any) {
  const user = await getRequestUser(req);
  if (!user || !isAdmin(user)) return new NextResponse('Forbidden', { status:403 });
  const id = context?.params?.id;
  if (!id) return new NextResponse('Missing module id', { status:400 });
  const body = await req.json();
  if (!body || typeof body !== 'object') return new NextResponse('Invalid payload', { status:400 });
  const entries = Object.entries(body as Record<string,any>);
  for (const [k,v] of entries) {
    await modulesService.upsertSetting(id, k, v);
  }
  const settings = await modulesService.getSettings(id);
  return NextResponse.json({ success:true, settings });
}
