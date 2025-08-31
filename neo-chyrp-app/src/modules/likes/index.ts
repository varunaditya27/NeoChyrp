/** Likes Module Placeholder
 * - Simple toggle (user + post) -> like record.
 * - Emits LikeAdded / LikeRemoved events.
 * - Aggregate counts for display + potential ranking.
 */
import type { ModuleDescriptor } from '../index';
import { eventBus, CoreEvents } from '../../lib/events';

export function registerLikesModule(): ModuleDescriptor {
  return {
    name: 'likes',
    enabled: true,
    init() {
      // Demo: On like added, maybe schedule popularity recompute (placeholder)
      eventBus.subscribe(CoreEvents.LikeAdded, async ({ postId }: any) => {
        console.log('[likes] scheduled popularity update for', postId);
      });
    }
  };
}
