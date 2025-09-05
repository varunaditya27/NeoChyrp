/**
 * Post Views Module
 * -----------------
 * Tracks post view events with privacy-aware counting.
 * Anonymizes visitor data (hashed IP / UA).
 * Debounces repeated hits within time window.
 */

import crypto from 'crypto';

import { z } from 'zod';

import { prisma } from '@/src/lib/db';
import { eventBus, CoreEvents } from '../../lib/events';
import { registerModule, type ModuleContext } from '../../lib/modules/registry';

// In-memory debounce tracking (in production, use Redis)
const recentViews = new Map<string, number>();

export const viewsService = {
  /**
   * Record a view for a post with debouncing
   */
  async recordView(postId: string, ipAddress: string, userAgent?: string): Promise<boolean> {
    const visitorHash = this.hashVisitor(ipAddress, userAgent);
    const viewKey = `${postId}:${visitorHash}`;
    const now = Date.now();
    const debounceWindow = 15 * 60 * 1000; // 15 minutes

    // Check if this visitor has viewed this post recently
    const lastView = recentViews.get(viewKey);
    if (lastView && (now - lastView) < debounceWindow) {
      return false; // View not counted (too recent)
    }

    try {
      // Record the view in database
      await prisma.postView.create({
        data: {
          postId,
          ipHash: visitorHash,
          userAgent: userAgent?.slice(0, 500) || null, // Truncate long user agents
        },
      });

      // Update recent views cache
      recentViews.set(viewKey, now);

      // Emit view event for analytics
      await eventBus.emit(CoreEvents.ViewRegistered, {
        postId,
        visitorHash,
        timestamp: new Date(),
      });

      return true; // View counted

    } catch (error) {
      console.error('[Views] Error recording view:', error);
      return false;
    }
  },

  /**
   * Get view count for a post
   */
  async getViewCount(postId: string): Promise<number> {
    try {
      const count = await prisma.postView.count({
        where: { postId },
      });
      return count;
    } catch (error) {
      console.error('[Views] Error getting view count:', error);
      return 0;
    }
  },

  /**
   * Get view counts for multiple posts
   */
  async getViewCounts(postIds: string[]): Promise<Record<string, number>> {
    try {
      const views = await prisma.postView.groupBy({
        by: ['postId'],
        where: { postId: { in: postIds } },
        _count: { id: true },
      });

      const counts: Record<string, number> = {};
      for (const view of views) {
        counts[view.postId] = view._count.id;
      }

      // Fill in zeros for posts with no views
      for (const postId of postIds) {
        if (!(postId in counts)) {
          counts[postId] = 0;
        }
      }

      return counts;
    } catch (error) {
      console.error('[Views] Error getting view counts:', error);
      return {};
    }
  },

  /**
   * Get most viewed posts
   */
  async getMostViewedPosts(limit = 10, days?: number): Promise<Array<{ postId: string; viewCount: number }>> {
    try {
      const whereClause: any = {};

      if (days) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        whereClause.createdAt = { gte: since };
      }

      const views = await prisma.postView.groupBy({
        by: ['postId'],
        where: whereClause,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit,
      });

      return views.map(view => ({
        postId: view.postId,
        viewCount: view._count.id,
      }));
    } catch (error) {
      console.error('[Views] Error getting most viewed posts:', error);
      return [];
    }
  },

  /**
   * Get view statistics for a time period
   */
  async getViewStats(days = 30): Promise<{
    totalViews: number;
    uniqueVisitors: number;
    topPosts: Array<{ postId: string; viewCount: number }>;
  }> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const [totalViews, uniqueVisitors, topPosts] = await Promise.all([
        prisma.postView.count({
          where: { createdAt: { gte: since } },
        }),
        prisma.postView.aggregate({
          where: { createdAt: { gte: since } },
          _count: { ipHash: true },
        }),
        this.getMostViewedPosts(5, days),
      ]);

      return {
        totalViews,
        uniqueVisitors: uniqueVisitors._count.ipHash || 0,
        topPosts,
      };
    } catch (error) {
      console.error('[Views] Error getting view stats:', error);
      return {
        totalViews: 0,
        uniqueVisitors: 0,
        topPosts: [],
      };
    }
  },

  /**
   * Hash visitor information for privacy
   */
  hashVisitor(ipAddress: string, userAgent?: string): string {
    const data = `${ipAddress}:${userAgent || 'unknown'}`;
    return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
  },

  /**
   * Cleanup old view records (for maintenance)
   */
  async cleanupOldViews(daysToKeep = 365): Promise<number> {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysToKeep);

      const result = await prisma.postView.deleteMany({
        where: {
          createdAt: { lt: cutoff },
        },
      });

      return result.count;
    } catch (error) {
      console.error('[Views] Error cleaning up old views:', error);
      return 0;
    }
  },

  /**
   * Clean up recent views cache
   */
  cleanupRecentViews(): number {
    const now = Date.now();
    const expiredViews: string[] = [];

    for (const [key, timestamp] of recentViews.entries()) {
      if (now - timestamp > 15 * 60 * 1000) { // 15 minutes
        expiredViews.push(key);
      }
    }

    for (const key of expiredViews) {
      recentViews.delete(key);
    }

    return expiredViews.length;
  },
};

// Register module
registerModule({
  manifest: {
    slug: 'views',
    name: 'Post Views',
    description: 'Tracks post view statistics',
    version: '1.0.0',
    dependencies: [],
    config: {
      schema: z.object({
        debounceMinutes: z.number().min(1).max(60).default(15),
        trackUserAgent: z.boolean().default(true),
        maxRetentionDays: z.number().min(30).max(365).default(365),
      }),
      defaults: {
        debounceMinutes: 15,
        trackUserAgent: true,
        maxRetentionDays: 365,
      },
    },
  },
  activate(_ctx: ModuleContext) {
    // Module activation logic here if needed
  },
  config: {
    debounceMinutes: 15,
    trackUserAgent: true,
    maxRetentionDays: 365,
  },
});

// Periodic cleanup of in-memory cache (every 30 minutes)
setInterval(() => {
  viewsService.cleanupRecentViews();
}, 30 * 60 * 1000);
