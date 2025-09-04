/** Bootstrap modules & global services */
import { memoryCache } from '@/src/lib/cache/memory';
import { prisma } from '@/src/lib/db';
import { eventBus, CoreEvents } from '@/src/lib/events/index';
import { registerJob } from '@/src/lib/jobs/scheduler';
import { moduleRegistry } from '@/src/lib/modules/registry';
import { settingsService } from '@/src/lib/settings/service';
import { sitemapService } from '@/src/modules/sitemap';

// Lightweight scheduler for promoting scheduled posts to published state
let lastScheduleRun = 0;
async function runScheduledPublishSweep() {
  const nowTs = Date.now();
  // Throttle to once per 60s per process
  if (nowTs - lastScheduleRun < 60_000) return;
  lastScheduleRun = nowTs;
  try {
    const due = await prisma.post.findMany({
      where: { visibility: 'SCHEDULED', publishedAt: { lte: new Date() } },
      select: { id: true }
    });
    if (!due.length) return;
    const updates = await Promise.all(due.map(p => prisma.post.update({ where: { id: p.id }, data: { visibility: 'PUBLISHED' } })));
    for (const post of updates) {
      await eventBus.emit(CoreEvents.PostUpdated, { postId: post.id, post });
      await eventBus.emit(CoreEvents.PostPublished, { postId: post.id, post });
    }
    console.log(`[Scheduler] Published ${updates.length} scheduled post(s).`);
  } catch (e) {
    console.warn('[Scheduler] Sweep failed', e);
  }
}
import '@/src/modules';
import '@/src/lib/captcha/filter';

let bootstrapped = false;

function bootstrapOnce() {
  if (bootstrapped) return;
  moduleRegistry.setContext({ db: prisma, cache: memoryCache, logger: console, settings: settingsService, events: eventBus, storage: {} });
  // Activate all registered modules best-effort
  for (const [slug] of moduleRegistry.listModules()) {
    moduleRegistry.activate(slug).catch(e => console.warn(`Module ${slug} activation failed`, e));
  }
  // Event driven cache invalidation
  eventBus.on(CoreEvents.CacheInvalidate, (e: any) => {
    const { keys = [], tags = [] } = e as any;
    if (Array.isArray(keys) && keys.length) memoryCache.invalidateKeys(keys);
    if (Array.isArray(tags) && tags.length) memoryCache.invalidateTags(tags);
  });
  eventBus.on(CoreEvents.CacheClear, () => memoryCache.clear());
  bootstrapped = true;
  // Run scheduled publish sweep best-effort (non-blocking)
  runScheduledPublishSweep();
  // Periodic sitemap regeneration (every 6h)
  registerJob('sitemap-regeneration', 6 * 60 * 60 * 1000, async () => {
    await sitemapService.generateSitemap();
  });
  // Cache warm (homepage/blog) every 10m (placeholder)
  registerJob('cache-warm', 10 * 60 * 1000, async () => {
    try { await fetch((process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') + '/blog').catch(()=>{}); } catch {/* ignore */}
  });
}

bootstrapOnce();
