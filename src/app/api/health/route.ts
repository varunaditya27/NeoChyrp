/**
 * Health endpoint for uptime checks.
 * - Returns build timestamp & basic DB connectivity result.
 */
import { NextResponse } from 'next/server';

import { prisma } from '@/src/lib/db';

export async function GET() {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }
  return NextResponse.json({ status: 'ok', db: dbOk, buildTime: process.env.BUILD_TIME || null });
}
