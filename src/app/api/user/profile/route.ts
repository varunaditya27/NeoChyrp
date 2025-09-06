import { type NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/src/lib/db';
import { getRequestUser } from '@/src/lib/auth/requestUser';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const reqUser = await getRequestUser(request);
    if (!reqUser) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: reqUser.id },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, user });
  } catch (e) {
    console.error('[GET /api/user/profile] error', e);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const reqUser = await getRequestUser(request);
    if (!reqUser) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    let { displayName, bio, avatarUrl } = body || {};

    if (displayName && typeof displayName !== 'string') displayName = undefined;
    if (bio && typeof bio !== 'string') bio = undefined;
    if (avatarUrl && typeof avatarUrl !== 'string') avatarUrl = undefined;

    const data: any = {};
    if (typeof displayName === 'string') data.displayName = displayName.slice(0, 120);
    if (typeof bio === 'string') data.bio = bio.slice(0, 2000);
    if (typeof avatarUrl === 'string') data.avatarUrl = avatarUrl.slice(0, 1024);

    if (!Object.keys(data).length) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await prisma.user.update({ where: { id: reqUser.id }, data, select: {
      id: true, username: true, email: true, displayName: true, avatarUrl: true, bio: true, createdAt: true
    }});

    return NextResponse.json({ success: true, user: updated, message: 'Profile updated' });
  } catch (e) {
    console.error('[PUT /api/user/profile] error', e);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
