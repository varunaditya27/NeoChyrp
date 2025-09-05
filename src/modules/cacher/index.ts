/**
 * Cacher Module
 * -------------
 * Provides comprehensive caching functionality with event-driven invalidation.
 * Initial implementation uses in-memory storage, can be extended to Redis/Edge KV.
 * Handles cache invalidation on relevant events (post update/delete, comment add).
 */

import { z } from 'zod';

import { eventBus, CoreEvents } from '../../lib/events';
import { registerModule } from '../../lib/modules/registry';

// Enhanced cache entry structure
interface CacheEntry {
  body: string;
  updated: number;
  tags: string[];
  ttl: number;
}

// Cache service with enhanced functionality
const cache = new Map<string, CacheEntry>();

export const cacheService = {
  get(key: string): string | null {
    const item = cache.get(key);
    if (!item) return null;

    // Check if cache is expired
    if (Date.now() - item.updated > item.ttl) {
      cache.delete(key);
      return null;
    }

    return item.body;
  },

  set(key: string, value: string, ttl: number = 300000, tags: string[] = []): void {
    cache.set(key, {
      body: value,
      updated: Date.now(),
      tags,
      ttl,
    });
  },

  delete(key: string): void {
    cache.delete(key);
  },

  /**
   * Invalidate cache entries by tag
   */
  invalidateByTag(tag: string): number {
    let invalidated = 0;
    for (const [key, entry] of cache.entries()) {
      if (entry.tags.includes(tag)) {
        cache.delete(key);
        invalidated++;
      }
    }
    return invalidated;
  },

  /**
   * Invalidate multiple tags at once
   */
  invalidateByTags(tags: string[]): number {
    let totalInvalidated = 0;
    for (const tag of tags) {
      totalInvalidated += this.invalidateByTag(tag);
    }
    return totalInvalidated;
  },

  clear(): void {
    cache.clear();
  },

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of cache.entries()) {
      if (now - entry.updated > entry.ttl) {
        cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  },

  getStats() {
    return {
      size: cache.size,
      keys: Array.from(cache.keys()),
      memoryUsage: JSON.stringify([...cache.values()]).length,
    };
  },

  /**
   * Cache with automatic tags based on content type
   */
  cachePost(postId: string, content: string, ttl: number = 300000): void {
    this.set(`post:${postId}`, content, ttl, [`post:${postId}`, 'posts']);
  },

  cachePostList(key: string, content: string, ttl: number = 180000): void {
    this.set(key, content, ttl, ['posts', 'lists']);
  },

  cacheCategory(categoryId: string, content: string, ttl: number = 600000): void {
    this.set(`category:${categoryId}`, content, ttl, [`category:${categoryId}`, 'categories']);
  },

  cacheTag(tagId: string, content: string, ttl: number = 600000): void {
    this.set(`tag:${tagId}`, content, ttl, [`tag:${tagId}`, 'tags']);
  },

  /**
   * ISR-like functionality for Next.js pages
   */
  async revalidatePage(path: string): Promise<void> {
    // In a real implementation, this would call Next.js revalidate API
    console.log('[Cache] Would revalidate page:', path);

    // For now, just invalidate related cache entries
    this.invalidateByTag('pages');
  },
};

// Register the module
registerModule({
  manifest: {
    slug: 'cacher',
    name: 'Cacher',
    version: '1.0.0',
    description: 'Enhanced caching system with tag-based invalidation',
    dependencies: [],
    config: {
      schema: z.object({
        defaultTTL: z.number().default(300000), // 5 minutes
        maxSize: z.number().default(1000), // max cache entries
        enableCleanup: z.boolean().default(true),
        cleanupInterval: z.number().default(60000), // 1 minute
      }),
      defaults: {
        defaultTTL: 300000,
        maxSize: 1000,
        enableCleanup: true,
        cleanupInterval: 60000,
      },
    },
  },

  config: {
    defaultTTL: 300000,
    maxSize: 1000,
    enableCleanup: true,
    cleanupInterval: 60000,
  },

  async activate() {
    console.log('[Cacher] Module activated');

    // Set up periodic cleanup
    if (this.config?.enableCleanup) {
      const interval = (this.config.cleanupInterval as number) || 60000;
      setInterval(() => {
        const cleaned = cacheService.cleanup();
        if (cleaned > 0) {
          console.log(`[Cacher] Cleaned up ${cleaned} expired cache entries`);
        }
      }, interval);
    }

    // Cache invalidation on post events
    eventBus.on(CoreEvents.PostUpdated, async (payload: any) => {
      const { postId, slug } = payload || {};
      if (!postId) return;

      console.log('[Cacher] Invalidating cache for updated post:', postId);

      // Invalidate specific post and related caches
      cacheService.invalidateByTags([
        `post:${postId}`,
        'posts',
        'lists',
        'feed',
        'sitemap'
      ]);

      // Revalidate post page if slug available
      if (slug) {
        await cacheService.revalidatePage(`/blog/${slug}`);
      }
    });

    eventBus.on(CoreEvents.PostDeleted, async (payload: any) => {
      const { postId, slug } = payload || {};
      if (!postId) return;

      console.log('[Cacher] Invalidating cache for deleted post:', postId);

      cacheService.invalidateByTags([
        `post:${postId}`,
        'posts',
        'lists',
        'feed',
        'sitemap'
      ]);

      if (slug) {
        await cacheService.revalidatePage(`/blog/${slug}`);
      }
    });

    eventBus.on(CoreEvents.PostPublished, async (payload: any) => {
      const { postId, slug } = payload || {};
      console.log('[Cacher] Invalidating cache for published post:', postId);

      cacheService.invalidateByTags([
        'posts',
        'lists',
        'feed',
        'sitemap'
      ]);

      if (slug) {
        await cacheService.revalidatePage(`/blog/${slug}`);
        await cacheService.revalidatePage('/');
      }
    });

    // Cache invalidation on comment events
    eventBus.on(CoreEvents.CommentCreated, async (payload: any) => {
      const { postId } = payload || {};
      if (!postId) return;

      console.log('[Cacher] Invalidating cache for new comment on post:', postId);

      cacheService.invalidateByTags([
        `post:${postId}`,
        'comments'
      ]);
    });

    // Cache invalidation on category events (when events are available)
    // eventBus.on(CoreEvents.CategoryCreated, async (_payload: any) => {
    //   console.log('[Cacher] Invalidating category cache for new category');
    //   cacheService.invalidateByTags(['categories']);
    // });

    // eventBus.on(CoreEvents.CategoryUpdated, async (payload: any) => {
    //   const { categoryId } = payload || {};
    //   console.log('[Cacher] Invalidating cache for updated category:', categoryId);
    //
    //   cacheService.invalidateByTags([
    //     `category:${categoryId}`,
    //     'categories'
    //   ]);
    // });

    // eventBus.on(CoreEvents.CategoryDeleted, async (payload: any) => {
    //   const { categoryId } = payload || {};
    //   console.log('[Cacher] Invalidating cache for deleted category:', categoryId);
    //
    //   cacheService.invalidateByTags([
    //     `category:${categoryId}`,
    //     'categories'
    //   ]);
    // });

    // Cache invalidation on tag events
    eventBus.on(CoreEvents.TagCreated, async () => {
      console.log('[Cacher] Invalidating tag cache for new tag');
      cacheService.invalidateByTags(['tags']);
    });

    // Cache invalidation on like events
    eventBus.on(CoreEvents.LikeAdded, async (payload: any) => {
      const { postId } = payload || {};
      if (postId) {
        cacheService.invalidateByTags([`post:${postId}`]);
      }
    });

    eventBus.on(CoreEvents.LikeRemoved, async (payload: any) => {
      const { postId } = payload || {};
      if (postId) {
        cacheService.invalidateByTags([`post:${postId}`]);
      }
    });

    // Global cache clear on settings update
    eventBus.on(CoreEvents.SettingsUpdated, async () => {
      console.log('[Cacher] Clearing all cache due to settings update');
      cacheService.clear();
    });
  },

  async deactivate() {
    console.log('[Cacher] Module deactivated');
    cacheService.clear();
  },
});
