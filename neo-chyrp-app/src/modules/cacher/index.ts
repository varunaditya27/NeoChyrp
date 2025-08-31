/** Cacher Module Placeholder
 * - Strategy: cache rendered HTML fragments or JSON API responses.
 * - Initial simplistic in-memory map; later pluggable (Redis / Edge KV / CDN layer).
 * - Handles invalidation on relevant events (post update/delete, comment add).
 */
import type { ModuleDescriptor } from '../index';
import { eventBus, CoreEvents } from '../../lib/events';

export function registerCacherModule(): ModuleDescriptor {
  const cache = new Map<string, { body: string; updated: number }>();
  return {
    name: 'cacher',
    enabled: true,
    init() {
      eventBus.subscribe(CoreEvents.PostUpdated, ({ postId }: any) => {
        // naive key pattern example
        cache.delete(`post:${postId}`);
      });
    },
    dispose() {
      cache.clear();
    }
  };
}
