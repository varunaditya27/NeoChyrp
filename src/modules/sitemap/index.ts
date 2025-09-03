/**
 * Sitemap Module
 * --------------
 * Generates sitemap.xml for published posts and pages.
 * Triggers regeneration on post publish/update events with debounce.
 */

import { z } from 'zod';

import { eventBus, CoreEvents } from '../../lib/events';
import { registerModule } from '../../lib/modules/registry';

let lastQueued = 0;

export const sitemapService = {
  async generateSitemap(): Promise<string> {
    // TODO: Implement actual sitemap generation
    console.log('[Sitemap] Generating sitemap.xml');

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

    return sitemap;
  },

  queueRegeneration(): void {
    const now = Date.now();
    if (now - lastQueued < 10_000) return; // simple debounce
    lastQueued = now;
    console.log('[Sitemap] Regeneration queued');

    // TODO: Implement actual queued regeneration
    setTimeout(() => {
      this.generateSitemap();
    }, 1000);
  }
};

// Register the module
registerModule({
  manifest: {
    slug: 'sitemap',
    name: 'Sitemap',
    version: '1.0.0',
    description: 'XML sitemap generation for published content',
    dependencies: [],
    config: {
      schema: z.object({
        debounceMs: z.number().default(10000),
        includePages: z.boolean().default(true),
        includePosts: z.boolean().default(true),
      }),
      defaults: {
        debounceMs: 10000,
        includePages: true,
        includePosts: true,
      },
    },
  },
  async activate() {
    console.log('[Sitemap] Module activated');

    eventBus.subscribe(CoreEvents.PostPublished, async () => {
      sitemapService.queueRegeneration();
    });

    eventBus.subscribe(CoreEvents.PostUpdated, async () => {
      sitemapService.queueRegeneration();
    });

    eventBus.subscribe(CoreEvents.PostDeleted, async () => {
      sitemapService.queueRegeneration();
    });
  },

  async deactivate() {
    console.log('[Sitemap] Module deactivated');
  },
});
