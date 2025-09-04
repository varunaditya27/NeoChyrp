/**
 * Cacher Module
 * -------------
 * Provides caching functionality for rendered content and API responses.
 * Initial implementation uses in-memory storage, can be extended to Redis/Edge KV.
 * Handles cache invalidation on relevant events (post update/delete, comment add).
 */

import { z } from 'zod';

import { eventBus, CoreEvents } from '../../lib/events';
import { registerModule } from '../../lib/modules/registry';

// Cache service
const cache = new Map<string, { body: string; updated: number }>();

export const cacheService = {
  get(key: string): string | null {
    const item = cache.get(key);
    if (!item) return null;

    // Check if cache is expired (5 minutes default)
    const maxAge = 5 * 60 * 1000;
    if (Date.now() - item.updated > maxAge) {
      cache.delete(key);
      return null;
    }

    return item.body;
  },

  set(key: string, value: string): void {
    cache.set(key, {
      body: value,
      updated: Date.now(),
    });
  },

  delete(key: string): void {
    cache.delete(key);
  },

  clear(): void {
    cache.clear();
  },

  getStats() {
    return {
      size: cache.size,
      keys: Array.from(cache.keys()),
    };
  },
};

// Register the module
registerModule({
  manifest: {
    slug: 'cacher',
    name: 'Cacher',
    version: '1.0.0',
    description: 'In-memory caching system for rendered content and API responses',
    dependencies: [],
    config: {
      schema: z.object({
        maxAge: z.number().default(300), // 5 minutes
        maxSize: z.number().default(1000), // max cache entries
      }),
      defaults: {
        maxAge: 300,
        maxSize: 1000,
      },
    },
  },
  async activate() {
    console.log('[Cacher] Module activated');

    // Cache invalidation on post events
  eventBus.on(CoreEvents.PostUpdated, async (payload: any) => {
      const { postId } = payload || {};
    if (!postId) return;
      console.log('[Cacher] Invalidating cache for post:', postId);
      cacheService.delete(`post:${postId}`);
      cacheService.delete(`post-rendered:${postId}`);
    });

  eventBus.on(CoreEvents.PostDeleted, async (payload: any) => {
      const { postId } = payload || {};
    if (!postId) return;
      console.log('[Cacher] Invalidating cache for deleted post:', postId);
      cacheService.delete(`post:${postId}`);
      cacheService.delete(`post-rendered:${postId}`);
    });

    // Cache invalidation on comment events
  eventBus.on(CoreEvents.CommentCreated, async (payload: any) => {
      const { postId } = payload || {};
    if (!postId) return;
      console.log('[Cacher] Invalidating post cache due to new comment:', postId);
      cacheService.delete(`post-comments:${postId}`);
    });
  },

  async deactivate() {
    console.log('[Cacher] Module deactivated');
    cacheService.clear();
  },
});
