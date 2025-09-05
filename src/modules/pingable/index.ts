/**
 * Pingable Module
 * ---------------
 * Handles automatic pinging/notifications to external services
 * when content is published or updated.
 * Supports XML-RPC pings and modern webhook notifications.
 */

import { z } from 'zod';

import { prisma } from '../../lib/db';
import { eventBus, CoreEvents } from '../../lib/events';
import { registerModule, type ModuleContext } from '../../lib/modules/registry';

interface PingTarget {
  name: string;
  url: string;
  type: 'xmlrpc' | 'webhook';
  enabled: boolean;
}

interface PingResult {
  target: string;
  success: boolean;
  error?: string;
  responseTime?: number;
}

export const pingableService = {
  /**
   * Send XML-RPC ping to a target
   */
  async sendXmlRpcPing(
    target: PingTarget,
    siteName: string,
    siteUrl: string,
    postUrl?: string
  ): Promise<PingResult> {
    const startTime = Date.now();

    try {
      // Build XML-RPC payload
      const method = postUrl ? 'weblogUpdates.extendedPing' : 'weblogUpdates.ping';
      const params = postUrl
        ? [siteName, siteUrl, postUrl]
        : [siteName, siteUrl];

      const xmlPayload = this.buildXmlRpcPayload(method, params);

      const response = await fetch(target.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          'User-Agent': 'NeoChyrp/1.0',
        },
        body: xmlPayload,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();

      // Basic XML-RPC response parsing
      const isSuccess = !responseText.includes('<fault>') &&
                       (responseText.includes('<boolean>0</boolean>') ||
                        responseText.includes('<boolean>false</boolean>'));

      if (!isSuccess) {
        const faultMatch = responseText.match(/<string>(.*?)<\/string>/);
        const errorMessage = faultMatch ? faultMatch[1] : 'Unknown XML-RPC error';
        throw new Error(errorMessage);
      }

      return {
        target: target.name,
        success: true,
        responseTime,
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        target: target.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
      };
    }
  },

  /**
   * Send webhook notification to a target
   */
  async sendWebhook(
    target: PingTarget,
    payload: any
  ): Promise<PingResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(target.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NeoChyrp/1.0',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        target: target.name,
        success: true,
        responseTime,
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        target: target.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
      };
    }
  },

  /**
   * Build XML-RPC payload
   */
  buildXmlRpcPayload(method: string, params: string[]): string {
    const paramXml = params.map(param =>
      `<param><value><string>${this.escapeXml(param)}</string></value></param>`
    ).join('');

    return `<?xml version="1.0"?>
<methodCall>
  <methodName>${method}</methodName>
  <params>
    ${paramXml}
  </params>
</methodCall>`;
  },

  /**
   * Escape XML entities
   */
  escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /**
   * Get default ping targets
   */
  getDefaultTargets(): PingTarget[] {
    return [
      {
        name: 'Google Blog Search',
        url: 'http://blogsearch.google.com/ping/RPC2',
        type: 'xmlrpc',
        enabled: true,
      },
      {
        name: 'Ping-o-Matic',
        url: 'http://rpc.pingomatic.com/',
        type: 'xmlrpc',
        enabled: true,
      },
      {
        name: 'FeedBurner',
        url: 'http://ping.feedburner.com/',
        type: 'xmlrpc',
        enabled: false, // Disabled by default since FeedBurner is deprecated
      },
    ];
  },

  /**
   * Send pings to all configured targets
   */
  async sendPings(
    siteName: string,
    siteUrl: string,
    postUrl?: string,
    customTargets: PingTarget[] = []
  ): Promise<PingResult[]> {
    const targets = [...this.getDefaultTargets(), ...customTargets]
      .filter(target => target.enabled);

    if (targets.length === 0) {
      console.log('[Pingable] No ping targets configured');
      return [];
    }

    console.log(`[Pingable] Sending pings to ${targets.length} targets`);

    const promises = targets.map(target => {
      if (target.type === 'xmlrpc') {
        return this.sendXmlRpcPing(target, siteName, siteUrl, postUrl);
      } else {
        // Webhook payload
        const payload = {
          event: postUrl ? 'post_published' : 'site_updated',
          site: {
            name: siteName,
            url: siteUrl,
          },
          post: postUrl ? { url: postUrl } : undefined,
          timestamp: new Date().toISOString(),
        };
        return this.sendWebhook(target, payload);
      }
    });

    const results = await Promise.allSettled(promises);

    const pingResults: PingResult[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          target: targets[index]?.name || 'Unknown target',
          success: false,
          error: result.reason?.message || 'Promise rejected',
        };
      }
    });

    // Log results
    const successful = pingResults.filter(r => r.success).length;
    const failed = pingResults.filter(r => !r.success).length;

    console.log(`[Pingable] Ping results: ${successful} successful, ${failed} failed`);

    if (failed > 0) {
      const failedTargets = pingResults
        .filter(r => !r.success)
        .map(r => `${r.target}: ${r.error}`)
        .join(', ');
      console.warn(`[Pingable] Failed pings: ${failedTargets}`);
    }

    return pingResults;
  },

  /**
   * Handle post publication event
   */
  async handlePostPublished(event: any): Promise<void> {
    try {
      const { post, site } = event;

      if (!post || !site) {
        console.warn('[Pingable] Missing post or site data in event');
        return;
      }

      const siteName = site.name || 'Blog';
      const siteUrl = site.url || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const postUrl = `${siteUrl}/posts/${post.slug}`;

      await this.sendPings(siteName, siteUrl, postUrl);

    } catch (error) {
      console.error('[Pingable] Error handling post published event:', error);
    }
  },

  /**
   * Handle site update event
   */
  async handleSiteUpdated(event: any): Promise<void> {
    try {
      const { site } = event;

      if (!site) {
        console.warn('[Pingable] Missing site data in event');
        return;
      }

      const siteName = site.name || 'Blog';
      const siteUrl = site.url || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

      await this.sendPings(siteName, siteUrl);

    } catch (error) {
      console.error('[Pingable] Error handling site updated event:', error);
    }
  },
};

// Register module
registerModule({
  manifest: {
    slug: 'pingable',
    name: 'Pingable',
    description: 'Automatic ping/notification system for external services',
    version: '1.0.0',
    dependencies: [],
    config: {
      schema: z.object({
        enabled: z.boolean().default(true),
        customTargets: z.array(z.object({
          name: z.string(),
          url: z.string().url(),
          type: z.enum(['xmlrpc', 'webhook']),
          enabled: z.boolean(),
        })).default([]),
        timeout: z.number().min(1000).max(30000).default(10000),
      }),
      defaults: {
        enabled: true,
        customTargets: [],
        timeout: 10000,
      },
    },
  },
  activate(_ctx: ModuleContext) {
    // Module activation logic here if needed
  },
  config: {
    enabled: true,
    customTargets: [],
    timeout: 10000,
  },
});

// Set up event handlers
eventBus.on(CoreEvents.PostPublished, pingableService.handlePostPublished);
eventBus.on(CoreEvents.SettingsUpdated, pingableService.handleSiteUpdated);
