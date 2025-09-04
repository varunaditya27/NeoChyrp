/**
 * Sitemap Module
 * --------------
 * Generates sitemap.xml for published posts and pages.
 * Triggers regeneration on post publish/update events with debounce.
 */

import { z } from 'zod';

import { eventBus, CoreEvents } from '../../lib/events';
import { prisma } from '@/src/lib/db';
import { registerModule } from '../../lib/modules/registry';

let lastQueued = 0;

export const sitemapService = {
  async generateSitemap(): Promise<string> {
    console.log('[Sitemap] Generating sitemap.xml');
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const [posts, pages] = await Promise.all([
      prisma.post.findMany({ where: { visibility: 'PUBLISHED' }, select: { slug: true, updatedAt: true, publishedAt: true } }),
      prisma.page.findMany({ where: { visibility: 'PUBLISHED' }, select: { slug: true, updatedAt: true, publishedAt: true } })
    ]);
    const urls: string[] = [];
    urls.push(`<url><loc>${baseUrl}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`);
    urls.push(`<url><loc>${baseUrl}/blog</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`);
    for (const p of posts) {
      const lastmod = (p.publishedAt || p.updatedAt).toISOString();
      urls.push(`<url><loc>${baseUrl}/post/${p.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`);
    }
    for (const pg of pages) {
      const lastmod = (pg.publishedAt || pg.updatedAt).toISOString();
      urls.push(`<url><loc>${baseUrl}/page/${pg.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>`);
    }
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('\n')}</urlset>`;
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

  eventBus.on(CoreEvents.PostPublished, async () => {
      sitemapService.queueRegeneration();
    });

  eventBus.on(CoreEvents.PostUpdated, async () => {
      sitemapService.queueRegeneration();
    });

  eventBus.on(CoreEvents.PostDeleted, async () => {
      sitemapService.queueRegeneration();
    });
  },

  async deactivate() {
    console.log('[Sitemap] Module deactivated');
  },
});
