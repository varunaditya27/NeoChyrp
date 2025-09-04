interface Bucket { tokens: number; updated: number }

const buckets = new Map<string, Bucket>();

interface Options { capacity?: number; refillPerSec?: number; }

export function rateLimit(key: string, opts: Options = {}): boolean {
  const capacity = opts.capacity ?? 10;
  const refillPerSec = opts.refillPerSec ?? 1;
  const now = Date.now();
  const b = buckets.get(key) || { tokens: capacity, updated: now };
  // refill
  const delta = (now - b.updated) / 1000;
  b.tokens = Math.min(capacity, b.tokens + delta * refillPerSec);
  b.updated = now;
  if (b.tokens < 1) { buckets.set(key, b); return false; }
  b.tokens -= 1;
  buckets.set(key, b);
  return true;
}
