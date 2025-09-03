import { NextResponse } from 'next/server';

import { prisma } from '@/src/lib/db';

export const dynamic = 'force-dynamic';

// Next.js 15 type generation expects context.params to be a Promise<SegmentParams>
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.redirect(asset.url);
}
