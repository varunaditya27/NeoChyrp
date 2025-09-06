import bcrypt from 'bcryptjs';
import { type NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/src/lib/db';
import { getRequestUser } from '@/src/lib/auth/requestUser';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const reqUser = await getRequestUser(request);
    if (!reqUser) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { currentPassword, newPassword } = await request.json();
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ success: false, error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: reqUser.id } });
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    // If user has a password set, verify currentPassword; otherwise allow setting
    if (user.password) {
      if (!currentPassword || typeof currentPassword !== 'string') {
        return NextResponse.json({ success: false, error: 'Current password is required' }, { status: 400 });
      }
      const ok = await bcrypt.compare(currentPassword, user.password);
      if (!ok) return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: reqUser.id }, data: { password: hashed } });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (e) {
    console.error('[POST /api/user/password] error', e);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
