/**
 * Standard API response helpers for consistency.
 */
import { NextResponse } from 'next/server';

export interface ApiMeta { cursor?: string | null; next?: string | null; total?: number; }

export function ok<T>(data: T, meta?: ApiMeta, init: ResponseInit = {}) {
  return NextResponse.json({ data, meta: meta || null, error: null }, init);
}

export function created<T>(data: T, meta?: ApiMeta) {
  return ok(data, meta, { status: 201 });
}

export function failure(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ data: null, meta: null, error: { message, details } }, { status });
}
