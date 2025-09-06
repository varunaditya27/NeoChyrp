import { NextResponse } from 'next/server';
import { getUserFromBearer } from '@/src/lib/auth/currentUser';
import { prisma } from '@/src/lib/db';
import { publicAssetUrl } from '@/src/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getUserFromBearer(req.headers.get('authorization'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const assets = await prisma.asset.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json({ data: assets.map(a => {
    const ax:any = a as any;
    return {
      ...a,
      thumbnailUrl: ax.thumbnailPath ? publicAssetUrl(ax.thumbnailPath) : null,
      // assets are publicly accessible via /api/assets/:id which redirects to public URL
      secureUrl: `/api/assets/${a.id}`
    };
  }) });
}
