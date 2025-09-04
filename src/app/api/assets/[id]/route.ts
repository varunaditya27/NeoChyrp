import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { publicAssetUrl } from '@/src/lib/storage';

export const dynamic = 'force-dynamic';

// Next.js 15 type generation expects context.params to be a Promise<SegmentParams>
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const urlObj = new URL(req.url);
  const token = urlObj.searchParams.get('token');
  const thumb = urlObj.searchParams.get('thumb') === '1';
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const ax:any = asset as any;
  if (ax.accessToken && token !== ax.accessToken) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (thumb && ax.thumbnailPath) return NextResponse.redirect(publicAssetUrl(ax.thumbnailPath));
  return NextResponse.redirect(asset.url);
}
