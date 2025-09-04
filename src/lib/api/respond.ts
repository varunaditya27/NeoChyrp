/**
 * Standard API response helpers for consistency.
 */
import { NextResponse } from 'next/server';

export interface ApiMeta { cursor?: string | null; next?: string | null; total?: number; }

export function ok<T>(data: T, meta?: ApiMeta & { headers?: Record<string,string> }, init: ResponseInit = {}) {
  const headers: Record<string,string> = { ...meta?.headers };
  // Conditional GET support (ETag + If-None-Match)
  if (headers['ETag'] && typeof (globalThis as any).REQUEST !== 'undefined') {
    const req: Request | undefined = (globalThis as any).REQUEST;
    if (req) {
      const inm = req.headers.get('if-none-match');
      if (inm && inm === headers['ETag']) {
        return new NextResponse(null, { status: 304, headers });
      }
    }
  }
  return NextResponse.json({ data, meta: meta ? { ...meta, headers: undefined } : null, error: null }, { ...init, headers });
}

export function created<T>(data: T, meta?: ApiMeta) {
  return ok(data, meta, { status: 201 });
}

export function failure(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ data: null, meta: null, error: { message, details } }, { status });
}
