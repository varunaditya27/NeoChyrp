import { NextResponse } from 'next/server';
import { createMathChallenge } from '@/src/lib/captcha/store';
import { applyFilters } from '@/src/lib/triggers';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Allow filters to short-circuit or customize
  const disabled = await applyFilters('captcha_enabled', true);
  if (!disabled) return NextResponse.json({ data: { disabled: true } });
  const challenge = createMathChallenge();
  return NextResponse.json({ data: challenge });
}
