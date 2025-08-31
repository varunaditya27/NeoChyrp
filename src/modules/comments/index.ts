/** Comments Module Placeholder
 * Responsibilities:
 * - CRUD for comments, threaded replies.
 * - Moderation workflow (pending, approved, spam, deleted).
 * - Event emission on creation/moderation changes.
 * Future Enhancements:
 * - Rate limiting, spam detection (Akismet-style), per-user trust scores.
 */
import { eventBus, CoreEvents } from '../../lib/events';
import type { ModuleDescriptor } from '../index';

export function registerCommentsModule(): ModuleDescriptor {
  return {
    name: 'comments',
    enabled: true,
    init() {
      // Example subscription pattern (no-op for now)
      eventBus.subscribe(CoreEvents.PostDeleted, async ({ postId }: any) => {
        // TODO: cascade delete or mark comments as orphaned
        console.log('[comments] observed post deletion', postId);
      });
    }
  };
}
