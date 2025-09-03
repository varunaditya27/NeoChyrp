/** In-memory cache (dev / small scale)
 * - TTL support
 * - Tag + key invalidation
 * - Simple stats
 */
export interface CacheOptions { ttlSeconds?: number; tags?: string[] }
interface Entry { value: unknown; expiresAt: number | null; tags: Set<string> }

class MemoryCache {
  private store = new Map<string, Entry>();
  private hits = 0; private misses = 0;

  set(key: string, value: unknown, opts: CacheOptions = {}) {
    const expiresAt = opts.ttlSeconds ? Date.now() + opts.ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt, tags: new Set(opts.tags || []) });
  }

  get<T = unknown>(key: string): T | undefined {
    const e = this.store.get(key);
    if (!e) { this.misses++; return undefined; }
    if (e.expiresAt && e.expiresAt < Date.now()) { this.store.delete(key); this.misses++; return undefined; }
    this.hits++; return e.value as T;
  }

  has(key: string) { return this.get(key) !== undefined; }

  invalidateKeys(keys: string[]) { keys.forEach(k => this.store.delete(k)); }

  invalidateTags(tags: string[]) {
    for (const [k,v] of this.store.entries()) {
      if (tags.some(t => v.tags.has(t))) this.store.delete(k);
    }
  }

  clear() { this.store.clear(); }

  stats() { return { size: this.store.size, hits: this.hits, misses: this.misses }; }
}

export const memoryCache = new MemoryCache();
