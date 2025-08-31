/** Sitemap Module Placeholder
 * - Generates sitemap.xml (and optionally index) from published posts + pages.
 * - Trigger regeneration on PostPublished/PostUpdated events with debounce.
 */
import type { ModuleDescriptor } from '../index';
import { eventBus, CoreEvents } from '../../lib/events';

export function registerSitemapModule(): ModuleDescriptor {
  let lastQueued = 0;
  return {
    name: 'sitemap',
    enabled: true,
    init() {
      eventBus.subscribe(CoreEvents.PostPublished, queue);
      eventBus.subscribe(CoreEvents.PostUpdated, queue);
      function queue() {
        const now = Date.now();
        if (now - lastQueued < 10_000) return; // simple debounce
        lastQueued = now;
        console.log('[sitemap] regeneration queued');
      }
    }
  };
}
