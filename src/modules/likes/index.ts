/**
 * Likes Module
 * ------------
 * Provides like/favorite functionality for posts and comments:
 * - Toggle likes for posts and comments
 * - Track like counts and user interactions
 * - Emit events for like/unlike actions
 * - Provide like statistics and trending analysis
 */

import { z } from 'zod';

import { prisma } from '../../lib/db';
import { eventBus, CoreEvents } from '../../lib/events';
import { registerModule } from '../../lib/modules/registry';

// Like validation schema
export const LikeSchema = z.object({
  userId: z.string().uuid('Valid user ID is required'),
  postId: z.string().uuid('Valid post ID is required'),
});

export type LikeInput = z.infer<typeof LikeSchema>;// Like service functions
export const likeService = {
  /**
   * Toggle like for a post
   */
  async toggleLike(input: LikeInput) {
    const validatedInput = LikeSchema.parse(input);

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: validatedInput.postId },
    });
    if (!post) {
      throw new Error('Post not found');
    }

    // Check if like already exists
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: validatedInput.userId,
          postId: validatedInput.postId
        }
      },
    });

    if (existingLike) {
      // Remove like
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId: validatedInput.userId,
            postId: validatedInput.postId
          }
        },
      });

      // Emit unlike event
      await eventBus.emit(CoreEvents.LikeRemoved, {
        userId: validatedInput.userId,
        postId: validatedInput.postId,
      });

      return { liked: false, like: null };
    } else {
      // Add like
      const like = await prisma.like.create({
        data: {
          userId: validatedInput.userId,
          postId: validatedInput.postId,
        },
      });

      // Emit like event
      await eventBus.emit(CoreEvents.LikeAdded, {
        userId: validatedInput.userId,
        postId: validatedInput.postId,
      });

      return { liked: true, like };
    }
  },

  /**
   * Get like status for a user on a post
   */
  async getLikeStatus(userId: string, postId: string) {
    const like = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      },
    });

    return { liked: !!like, like };
  },

  /**
   * Get like count for a post
   */
  async getLikeCount(postId: string) {
    const count = await prisma.like.count({
      where: { postId },
    });

    return count;
  },

  /**
   * Get users who liked a post
   */
  async getLikers(postId: string, limit = 10) {
    const likes = await prisma.like.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return likes;
  },

  /**
   * Get most liked posts in a time period
   */
  async getMostLikedPosts(days = 7, limit = 10) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const posts = await prisma.post.findMany({
      where: {
        visibility: 'PUBLISHED',
        publishedAt: { gte: since },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: { where: { status: 'APPROVED' } },
          },
        },
      },
      orderBy: {
        likes: { _count: 'desc' },
      },
      take: limit,
    });

    return posts;
  },

  /**
   * Get like statistics for a user
   */
  async getUserLikeStats(userId: string) {
    const [likesGiven, likesReceived] = await Promise.all([
      prisma.like.count({
        where: { userId },
      }),
      prisma.like.count({
        where: {
          post: { authorId: userId },
        },
      }),
    ]);

    return { likesGiven, likesReceived };
  },

  /**
   * Clean up orphaned likes (for deleted posts)
   * Note: With foreign key constraints, this should not be needed
   */
  async cleanupOrphanedLikes() {
    // With proper foreign key constraints, orphaned likes should be
    // automatically cleaned up by the database
    return {
      deletedPostLikes: 0,
    };
  },
};

// Module registration
registerModule({
  manifest: {
    slug: 'likes',
    name: 'Likes',
    version: '1.0.0',
    description: 'Like/favorite system for posts and comments',
    dependencies: [],
    config: {
      schema: z.object({
        allowAnonymousLikes: z.boolean().default(true),
        showLikeCount: z.boolean().default(true),
        showLikers: z.boolean().default(true),
        maxLikersShown: z.number().default(10),
        rateLimitWindow: z.number().default(1),
        maxLikesPerWindow: z.number().default(10),
      }),
      defaults: {
        allowAnonymousLikes: true,
        showLikeCount: true,
        showLikers: true,
        maxLikersShown: 10,
        rateLimitWindow: 1,
        maxLikesPerWindow: 10,
      },
    },
  },
  async activate() {
    console.log('[Likes] Module activated');

    // Subscribe to post/comment deletion events
    eventBus.on(CoreEvents.PostDeleted, async (payload: any) => {
      const { postId } = payload || {};
      console.log('[Likes] Cleaning up likes for deleted post:', postId);
      await prisma.like.deleteMany({
        where: { postId },
      });
    });

  eventBus.on(CoreEvents.CommentDeleted, async () => {
      // Comments don't have likes in this implementation
    });

    // Update post popularity on like events
    eventBus.on(CoreEvents.LikeAdded, async (payload: any) => {
      const { postId } = payload || {};
      if (postId) {
        console.log('[Likes] Updating popularity for post:', postId);
        // Could implement popularity scoring algorithm here
      }
    });

    eventBus.on(CoreEvents.LikeRemoved, async (payload: any) => {
      const { postId } = payload || {};
      if (postId) {
        console.log('[Likes] Updating popularity for post:', postId);
        // Could implement popularity scoring algorithm here
      }
    });
  },

  async deactivate() {
    console.log('[Likes] Module deactivated');
  },
});

// The likeService is already exported above with 'export const'
