/**
 * WebMentions Module
 * ------------------
 * Handles incoming and outgoing webmentions for posts.
 * Receives external webmentions referencing local posts.
 * Verification workflow: fetch source, confirm link presence.
 */

import { z } from 'zod';

import { prisma } from '@/src/lib/db';
import { eventBus, CoreEvents } from '../../lib/events';
import { registerModule } from '../../lib/modules/registry';

interface WebMentionData {
  sourceUrl: string;
  targetUrl: string;
  type?: 'mention' | 'like' | 'repost' | 'reply';
  author?: {
    name?: string;
    url?: string;
    photo?: string;
  };
  content?: string;
  publishedAt?: Date;
}

interface ParsedMicroformat {
  type: string;
  author?: {
    name?: string;
    url?: string;
    photo?: string;
  };
  content?: string;
  publishedAt?: Date;
  inReplyTo?: string[];
  likeOf?: string[];
  repostOf?: string[];
}

export const webmentionService = {
  /**
   * Parse microformats from HTML content
   */
  parseMicroformats(html: string, sourceUrl: string): ParsedMicroformat | null {
    try {
      // Basic microformat parsing - look for h-entry
      const hEntryMatch = html.match(/<[^>]+class="[^"]*h-entry[^"]*"[^>]*>(.*?)<\/[^>]+>/is);
      if (!hEntryMatch || !hEntryMatch[1]) return null;

      const entryHtml = hEntryMatch[1];

      // Extract author information
      let author: any = {};
      const authorMatch = entryHtml.match(/<[^>]+class="[^"]*p-author[^"]*"[^>]*>(.*?)<\/[^>]+>/is);
      if (authorMatch && authorMatch[1]) {
        const authorHtml = authorMatch[1];
        const nameMatch = authorHtml.match(/<[^>]+class="[^"]*p-name[^"]*"[^>]*>(.*?)<\/[^>]+>/is);
        const urlMatch = authorHtml.match(/href="([^"]+)"/);
        const photoMatch = authorHtml.match(/<img[^>]+src="([^"]+)"/);

        if (nameMatch && nameMatch[1]) author.name = nameMatch[1].replace(/<[^>]*>/g, '').trim();
        if (urlMatch && urlMatch[1]) author.url = urlMatch[1];
        if (photoMatch && photoMatch[1]) author.photo = photoMatch[1];
      }

      // Extract content
      let content = '';
      const contentMatch = entryHtml.match(/<[^>]+class="[^"]*e-content[^"]*"[^>]*>(.*?)<\/[^>]+>/is);
      if (contentMatch && contentMatch[1]) {
        content = contentMatch[1].replace(/<[^>]*>/g, '').trim();
      }

      // Extract published date
      let publishedAt: Date | undefined;
      const publishedMatch = entryHtml.match(/<[^>]+class="[^"]*dt-published[^"]*"[^>]*datetime="([^"]+)"/);
      if (publishedMatch && publishedMatch[1]) {
        publishedAt = new Date(publishedMatch[1]);
      }

      // Determine type based on properties
      let type = 'mention';
      const inReplyTo: string[] = [];
      const likeOf: string[] = [];
      const repostOf: string[] = [];

      // Check for reply
      const replyMatch = entryHtml.match(/<[^>]+class="[^"]*u-in-reply-to[^"]*"[^>]*href="([^"]+)"/g);
      if (replyMatch) {
        replyMatch.forEach(match => {
          const urlMatch = match.match(/href="([^"]+)"/);
          if (urlMatch && urlMatch[1]) inReplyTo.push(urlMatch[1]);
        });
        if (inReplyTo.length > 0) type = 'reply';
      }

      // Check for like
      const likeMatch = entryHtml.match(/<[^>]+class="[^"]*u-like-of[^"]*"[^>]*href="([^"]+)"/g);
      if (likeMatch) {
        likeMatch.forEach(match => {
          const urlMatch = match.match(/href="([^"]+)"/);
          if (urlMatch && urlMatch[1]) likeOf.push(urlMatch[1]);
        });
        if (likeOf.length > 0) type = 'like';
      }

      // Check for repost
      const repostMatch = entryHtml.match(/<[^>]+class="[^"]*u-repost-of[^"]*"[^>]*href="([^"]+)"/g);
      if (repostMatch) {
        repostMatch.forEach(match => {
          const urlMatch = match.match(/href="([^"]+)"/);
          if (urlMatch && urlMatch[1]) repostOf.push(urlMatch[1]);
        });
        if (repostOf.length > 0) type = 'repost';
      }

      return {
        type: type as any,
        author: Object.keys(author).length > 0 ? author : undefined,
        content: content || undefined,
        publishedAt,
        inReplyTo: inReplyTo.length > 0 ? inReplyTo : undefined,
        likeOf: likeOf.length > 0 ? likeOf : undefined,
        repostOf: repostOf.length > 0 ? repostOf : undefined,
      };

    } catch (error) {
      console.error('[WebMentions] Error parsing microformats:', error);
      return null;
    }
  },

  /**
   * Verify and process an incoming webmention
   */
  async processWebMention(sourceUrl: string, targetUrl: string): Promise<{ ok: boolean; reason?: string; id?: string }> {
    console.log('[WebMentions] Processing incoming webmention', sourceUrl, '->', targetUrl);

    try {
      if (!sourceUrl || !targetUrl) {
        return { ok: false, reason: 'Missing source or target URL' };
      }

      // Validate URLs
      try {
        new URL(sourceUrl);
        new URL(targetUrl);
      } catch {
        return { ok: false, reason: 'Invalid URL format' };
      }

      // Check if target URL belongs to this site
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      if (!targetUrl.startsWith(siteUrl)) {
        return { ok: false, reason: 'Target URL does not belong to this site' };
      }

      // Extract post slug from target URL
      const postSlugMatch = targetUrl.match(/\/posts?\/([^\/\?#]+)/);
      if (!postSlugMatch) {
        return { ok: false, reason: 'Target URL does not point to a post' };
      }

      const postSlug = postSlugMatch[1];
      const post = await prisma.post.findUnique({ where: { slug: postSlug } });
      if (!post) {
        return { ok: false, reason: 'Target post not found' };
      }

      // Fetch source page with timeout
      const response = await fetch(sourceUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'NeoChyrp-WebMention/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return { ok: false, reason: `Failed to fetch source: ${response.status}` };
      }

      const html = await response.text();

      // Verify that source links to target
      if (!html.includes(targetUrl)) {
        return { ok: false, reason: 'Source does not link to target' };
      }

      // Parse microformats
      const microformat = this.parseMicroformats(html, sourceUrl);

      // Prepare webmention data
      const webmentionData = {
        sourceUrl,
        targetUrl,
        type: (microformat?.type || 'mention') as 'mention' | 'like' | 'repost' | 'reply',
        author: microformat?.author,
        content: microformat?.content,
        publishedAt: microformat?.publishedAt,
      };

      // Check for duplicate
      const existing = await prisma.webMention.findFirst({
        where: {
          sourceUrl,
          targetUrl,
        },
      });

      let webmentionId: string;

      if (existing) {
        // Update existing webmention
        const updated = await prisma.webMention.update({
          where: { id: existing.id },
          data: {
            type: webmentionData.type,
            rawPayload: webmentionData as any,
            verifiedAt: new Date(),
          },
        });
        webmentionId = updated.id;
      } else {
        // Create new webmention
        const created = await prisma.webMention.create({
          data: {
            sourceUrl,
            targetUrl,
            postId: post.id,
            type: webmentionData.type,
            rawPayload: webmentionData as any,
            verifiedAt: new Date(),
          },
        });
        webmentionId = created.id;
      }

      // Emit event
      await eventBus.emit(CoreEvents.WebMentionReceived, {
        id: webmentionId,
        sourceUrl,
        targetUrl,
        postId: post.id,
        type: webmentionData.type,
        data: webmentionData,
      });

      return { ok: true, id: webmentionId };

    } catch (error) {
      console.error('[WebMentions] Error processing webmention:', error);
      return { ok: false, reason: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Get webmentions for a post
   */
  async getWebMentionsForPost(postId: string): Promise<any[]> {
    try {
      const webmentions = await prisma.webMention.findMany({
        where: {
          postId,
          verifiedAt: { not: null },
        },
        orderBy: { createdAt: 'desc' },
      });

      return webmentions.map(wm => ({
        id: wm.id,
        sourceUrl: wm.sourceUrl,
        type: wm.type,
        author: (wm.rawPayload as any)?.author,
        content: (wm.rawPayload as any)?.content,
        publishedAt: (wm.rawPayload as any)?.publishedAt,
        createdAt: wm.createdAt,
      }));

    } catch (error) {
      console.error('[WebMentions] Error getting webmentions:', error);
      return [];
    }
  },

  /**
   * Send outgoing webmentions for a post
   */
  async sendOutgoingWebmentions(postId: string): Promise<void> {
    console.log('[WebMentions] Checking for outbound mentions in post', postId);

    try {
      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post || !post.renderedBody) return;

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const sourceUrl = `${siteUrl}/posts/${post.slug}`;

      // Extract URLs from post content
      const urlRegex = /https?:\/\/[^\s"'<>()]+/g;
      const urls = Array.from(new Set(post.renderedBody.match(urlRegex) || [])).slice(0, 25);

      for (const targetUrl of urls) {
        try {
          // Skip URLs from the same domain
          if (targetUrl.startsWith(siteUrl)) continue;

          const endpoint = await this.discoverWebmentionEndpoint(targetUrl);
          if (!endpoint) continue;

          console.log(`[WebMentions] Sending webmention from ${sourceUrl} to ${targetUrl} via ${endpoint}`);

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'NeoChyrp-WebMention/1.0',
            },
            body: new URLSearchParams({
              source: sourceUrl,
              target: targetUrl,
            }).toString(),
          });

          const success = response.ok;
          console.log(`[WebMentions] Webmention ${success ? 'sent successfully' : 'failed'} to ${targetUrl}`);

          await eventBus.emit('webmention.sent', {
            postId,
            sourceUrl,
            targetUrl,
            endpoint,
            success,
            status: response.status,
          });

        } catch (error) {
          console.warn('[WebMentions] Failed to send webmention to', targetUrl, (error as Error).message);
        }
      }

    } catch (error) {
      console.error('[WebMentions] Error sending outgoing webmentions:', error);
    }
  },

  /**
   * Discover webmention endpoint for a URL
   */
  async discoverWebmentionEndpoint(url: string): Promise<string | null> {
    try {
      // Try HEAD request first (faster)
      let response = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'NeoChyrp-WebMention/1.0' },
        signal: AbortSignal.timeout(5000),
      });

      let endpoint = this.extractEndpointFromHeaders(response.headers, url);
      if (endpoint) return endpoint;

      // Fall back to GET request
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'NeoChyrp-WebMention/1.0',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) return null;

      // Check headers again
      endpoint = this.extractEndpointFromHeaders(response.headers, url);
      if (endpoint) return endpoint;

      // Parse HTML for endpoint
      const html = await response.text();
      return this.extractEndpointFromHtml(html, url);

    } catch (error) {
      console.warn('[WebMentions] Error discovering endpoint for', url, (error as Error).message);
      return null;
    }
  },

  /**
   * Extract webmention endpoint from HTTP headers
   */
  extractEndpointFromHeaders(headers: Headers, baseUrl: string): string | null {
    const linkHeader = headers.get('Link');
    if (!linkHeader) return null;

    const match = linkHeader.match(/<([^>]+)>;\s*rel=["']?webmention["']?/i);
    if (match && match[1]) {
      return new URL(match[1], baseUrl).toString();
    }

    return null;
  },

  /**
   * Extract webmention endpoint from HTML content
   */
  extractEndpointFromHtml(html: string, baseUrl: string): string | null {
    // Look for <link> element
    const linkMatch = html.match(/<link[^>]+rel=["']?webmention["']?[^>]*href=["']([^"']+)["']/i);
    if (linkMatch && linkMatch[1]) {
      return new URL(linkMatch[1], baseUrl).toString();
    }

    // Look for <a> element
    const aMatch = html.match(/<a[^>]+rel=["']?webmention["']?[^>]*href=["']([^"']+)["']/i);
    if (aMatch && aMatch[1]) {
      return new URL(aMatch[1], baseUrl).toString();
    }

    return null;
  },

  /**
   * Get webmention statistics
   */
  async getWebMentionStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    recent: any[];
  }> {
    try {
      const [total, byType, recent] = await Promise.all([
        prisma.webMention.count({
          where: { verifiedAt: { not: null } },
        }),
        prisma.webMention.groupBy({
          by: ['type'],
          where: { verifiedAt: { not: null } },
          _count: { id: true },
        }),
        prisma.webMention.findMany({
          where: { verifiedAt: { not: null } },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { post: { select: { title: true, slug: true } } },
        }),
      ]);

      const typeStats: Record<string, number> = {};
      byType.forEach(item => {
        typeStats[item.type || 'mention'] = item._count.id;
      });

      return {
        total,
        byType: typeStats,
        recent: recent.map(wm => ({
          id: wm.id,
          sourceUrl: wm.sourceUrl,
          type: wm.type,
          post: wm.post,
          createdAt: wm.createdAt,
        })),
      };

    } catch (error) {
      console.error('[WebMentions] Error getting stats:', error);
      return { total: 0, byType: {}, recent: [] };
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
        maxRetries: z.number().min(1).max(10).default(3),
        timeout: z.number().min(1000).max(30000).default(10000),
        autoSendOnPublish: z.boolean().default(true),
      }),
      defaults: {
        enableIncoming: true,
        enableOutgoing: true,
        verifyMentions: true,
        maxRetries: 3,
        timeout: 10000,
        autoSendOnPublish: true,
      },
    },
  },
  async activate() {
    console.log('[WebMentions] Module activated');
  },
  async deactivate() {
    console.log('[WebMentions] Module deactivated');
  },
});

// Set up event handlers
eventBus.on(CoreEvents.PostPublished, async (payload: any) => {
  const { post } = payload;
  if (!post?.id) return;

  console.log('[WebMentions] Post published, checking for outgoing webmentions:', post.id);
  await webmentionService.sendOutgoingWebmentions(post.id);
});

eventBus.on(CoreEvents.PostUpdated, async (payload: any) => {
  const { post } = payload;
  if (!post?.id) return;

  console.log('[WebMentions] Post updated, checking for outgoing webmentions:', post.id);
  await webmentionService.sendOutgoingWebmentions(post.id);
});
