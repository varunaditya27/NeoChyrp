import { type NextRequest, NextResponse } from 'next/server';
import { modulesService } from '@/src/lib/modules/service';
import { getRequestUser } from '@/src/lib/auth/requestUser';
import { isAdmin } from '@/src/lib/auth/adminAccess';

export async function PUT(request: NextRequest, context: any) {
  const user = await getRequestUser(request);
  if (!user || !isAdmin(user)) return new NextResponse('Forbidden', { status: 403 });
  const { id } = context.params;
  const body = await request.json();
  try {
    if (typeof body.enabled === 'boolean') {
      const updated = await modulesService.toggle(id, body.enabled);
      return NextResponse.json({ success: true, module: updated });
    }
    const updated = await modulesService.update(id, body);
    return NextResponse.json({ success: true, module: updated });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
