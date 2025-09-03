/**
 * WebMentions Module
 * ------------------
 * Handles incoming and outgoing webmentions for posts.
 * Receives external webmentions referencing local posts.
 * Verification workflow: fetch source, confirm link presence.
 */

import { z } from 'zod';

import { eventBus, CoreEvents } from '../../lib/events';
import { registerModule } from '../../lib/modules/registry';

export const webmentionService = {
  async parseWebMention(): Promise<boolean> {
    console.log('[WebMentions] Processing incoming webmention');

    // TODO: Implement webmention verification
    // 1. Fetch source URL
    // 2. Parse content and verify target link exists
    // 3. Extract mention type (like, reply, repost, etc.)
    // 4. Store webmention in database

    return true;
  },

  async sendOutgoingWebmentions(postId: string): Promise<void> {
    console.log('[WebMentions] Checking for outbound mentions in post', postId);

    // TODO: Implement outgoing webmention discovery and sending
    // 1. Parse content for URLs
    // 2. Discover webmention endpoints
    // 3. Send webmentions
  },
};

// Register the module
registerModule({
  manifest: {
    slug: 'webmentions',
    name: 'WebMentions',
    version: '1.0.0',
    description: 'WebMention support for receiving and sending mentions',
    dependencies: [],
    config: {
      schema: z.object({
        enableIncoming: z.boolean().default(true),
        enableOutgoing: z.boolean().default(true),
        verifyMentions: z.boolean().default(true),
        maxRetries: z.number().default(3),
      }),
      defaults: {
        enableIncoming: true,
        enableOutgoing: true,
        verifyMentions: true,
        maxRetries: 3,
      },
    },
  },
  async activate() {
    console.log('[WebMentions] Module activated');

  eventBus.on(CoreEvents.PostPublished, async (payload) => {
      const { postId } = payload as { postId: string; content?: string };
      console.log('[WebMentions] Evaluating outbound mentions for post:', postId);
      // TODO: Extract content and send webmentions
      await webmentionService.sendOutgoingWebmentions(postId);
    });
  },

  async deactivate() {
    console.log('[WebMentions] Module deactivated');
  },
});
