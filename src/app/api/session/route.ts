import { NextResponse } from 'next/server';

import { getDevSession } from '@/src/lib/session/devSession';

export async function GET() {
  const session = await getDevSession();
  return NextResponse.json({ session });
}
