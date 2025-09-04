/** Post Views Module
 * - Lightweight per-request view recording with IP hash de-dup window.
 * - Aggregates counts for analytics; emits events for popularity scoring.
 */
import { createHash } from 'crypto';

import { z } from 'zod';

import { prisma } from '@/src/lib/db';
import { eventBus } from '@/src/lib/events/index';
import { registerModule } from '@/src/lib/modules/registry';

const configSchema = z.object({
  dedupeMinutes: z.number().default(60),
  emitThreshold: z.number().default(25)
});

export const postViewsService = {
  async registerView(postId: string, ip: string, ua?: string | null) {
    const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 32);
    const now = new Date();
    const windowStart = new Date(now.getTime() - 60 * 60 * 1000);
    const existing = await prisma.postView.findFirst({ where: { postId, ipHash, createdAt: { gte: windowStart } } });
    if (existing) return { counted: false };
    await prisma.postView.create({ data: { postId, ipHash, userAgent: ua || undefined } });
    const count = await prisma.postView.count({ where: { postId, createdAt: { gte: windowStart } } });
    if (count === 1 || count % 10 === 0) await eventBus.emit('cache.invalidate', { keys: [`post:${postId}:views`] });
    return { counted: true };
  }
};

registerModule({
  manifest: {
    slug: 'post_views',
    name: 'Post Views',
    version: '1.0.0',
    description: 'Tracks anonymous view counts for posts',
    dependencies: [],
    config: { schema: configSchema, defaults: { dedupeMinutes: 60, emitThreshold: 25 } }
  },
  async activate() { console.log('[PostViews] activated'); },
  async deactivate() { console.log('[PostViews] deactivated'); }
});
