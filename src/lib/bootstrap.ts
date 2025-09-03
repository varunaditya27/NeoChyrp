/** Bootstrap modules & global services */
import { memoryCache } from '@/src/lib/cache/memory';
import { prisma } from '@/src/lib/db';
import { eventBus, CoreEvents } from '@/src/lib/events';
import { moduleRegistry } from '@/src/lib/modules/registry';
import { settingsService } from '@/src/lib/settings/service';
import '@/src/modules';

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
}

bootstrapOnce();
