import { NextRequest, NextResponse } from 'next/server';
import { modulesService } from '@/src/lib/modules/service';
import { getRequestUser } from '@/src/lib/auth/requestUser';
import { isAdmin } from '@/src/lib/auth/adminAccess';

export async function GET() {
  const modules = await modulesService.list();
  return NextResponse.json({ success: true, modules });
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user || !isAdmin(user)) return new NextResponse('Forbidden', { status: 403 });
  const body = await req.json();
  const { slug, name, version, description } = body;
  if (!slug || !name) return new NextResponse('Missing slug or name', { status: 400 });
  try {
    const created = await modulesService.create({ slug, name, version, description });
    return NextResponse.json({ success: true, module: created }, { status: 201 });
  } catch (e: any) {
    return new NextResponse(e.message, { status: 400 });
  }
}
