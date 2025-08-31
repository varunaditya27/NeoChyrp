/** WebMentions (Mentionable) Module Placeholder
 * - Receives external webmentions referencing local posts.
 * - Verification workflow: fetch source, confirm link presence.
 * - Stores raw payload + derived summary.
 */
import type { ModuleDescriptor } from '../index';
import { eventBus, CoreEvents } from '../../lib/events';

export function registerWebMentionsModule(): ModuleDescriptor {
  return {
    name: 'webmentions',
    enabled: true,
    init() {
      eventBus.subscribe(CoreEvents.PostPublished, async ({ postId }: any) => {
        // Placeholder: potentially send outbound webmentions.
        console.log('[webmentions] evaluate outbound mentions for', postId);
      });
    }
  };
}
