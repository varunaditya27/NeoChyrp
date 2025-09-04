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
  async parseWebMention(source: string, target: string): Promise<{ ok: boolean; reason?: string }> {
    console.log('[WebMentions] Processing incoming webmention', source, '->', target);
    try {
      if (!source || !target) return { ok:false, reason:'missing params' };
      // Basic guard
      const res = await fetch(source, { method:'GET', headers:{ 'User-Agent':'NeoChyrp-WebMention/1.0' } });
      if (!res.ok) return { ok:false, reason:'fetch failed' };
      const html = await res.text();
      if (!html.includes(target)) return { ok:false, reason:'target link not found' };
      // TODO: classify mention type
      // persist
      // (lightweight insert deferred until DB import to avoid noise until full endpoint built)
      await eventBus.emit(CoreEvents.WebMentionReceived, { source, target });
      return { ok:true };
    } catch (e:any) {
      return { ok:false, reason:e.message };
    }
  },

  async sendOutgoingWebmentions(postId: string): Promise<void> {
    console.log('[WebMentions] Checking for outbound mentions in post', postId);
    const post = await (await import('@/src/lib/db')).prisma.post.findUnique({ where:{ id: postId } });
    if (!post || !post.renderedBody) return;
    const body = post.renderedBody;
    const urlRegex = /https?:\/\/[^\s"'<>()]+/g;
    const urls = Array.from(new Set(body.match(urlRegex) || [])).slice(0,25);
    for (const target of urls) {
      try {
        // Discover endpoint via HEAD then GET fallback
        let endpoint: string | null = null;
        const discover = async (method: 'HEAD' | 'GET') => {
          const res = await fetch(target, { method, headers:{ 'User-Agent':'NeoChyrp-WebMention/1.0' } });
          if (!res.ok) return null;
          const link = res.headers.get('Link');
          if (link) {
            const m = link.match(/<([^>]+)>;\s*rel=["']?webmention["']?/i);
            if (m && m[1]) endpoint = new URL(m[1] as string, target).toString();
          }
          if (!endpoint && method === 'GET') {
            const html = await res.text();
            const m2 = html.match(/<link[^>]+rel=["']?webmention["']?[^>]*href=["']([^"']+)["']/i) || html.match(/<a[^>]+rel=["']?webmention["']?[^>]*href=["']([^"']+)["']/i);
            if (m2 && m2[1]) endpoint = new URL(m2[1] as string, target).toString();
          }
        };
        await discover('HEAD');
        if (!endpoint) await discover('GET');
        if (!endpoint) continue;
        const sourceUrl = `${process.env.PUBLIC_SITE_URL || 'http://localhost:3000'}/post/${post.slug}`;
        await fetch(endpoint, {
          method:'POST',
          headers:{ 'Content-Type':'application/x-www-form-urlencoded','User-Agent':'NeoChyrp-WebMention/1.0' },
          body: new URLSearchParams({ source: sourceUrl, target }).toString()
        });
  await eventBus.emit('webmention.sent', { postId, target, endpoint });
      } catch (e) {
        console.warn('[WebMentions] Outgoing failed', target, (e as Error).message);
      }
    }
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
