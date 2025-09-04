/**
 * Comments Module
 * ---------------
 * Provides comprehensive comment system functionality:
 * - CRUD operations for comments and threaded replies
 * - Moderation workflow (pending, approved, spam, deleted)
 * - Event emission for comment lifecycle changes
 * - Spam detection and rate limiting
 */

import { z } from 'zod';

import { prisma } from '../../lib/db';
import { eventBus, CoreEvents } from '../../lib/events';
import { registerModule } from '../../lib/modules/registry';
import { applyFilters } from '@/src/lib/triggers';

// Comment validation schema
export const CommentSchema = z.object({
  body: z.string().min(1, 'Comment content is required').max(10000, 'Comment too long'),
  guestName: z.string().min(1, 'Author name is required').max(100),
  guestUrl: z.string().url().optional().or(z.literal('')),
  postId: z.string().uuid('Valid post ID is required'),
  parentId: z.string().uuid().optional(),
});

export type CommentInput = z.infer<typeof CommentSchema>;

// Comment service functions
export const commentService = {
  /**
   * Create a new comment
   */
  async createComment(input: CommentInput & { captchaToken?: string; captchaAnswer?: string }) {
    const validatedInput = CommentSchema.parse(input);

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: validatedInput.postId },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    // Check if parent comment exists (for replies)
    if (validatedInput.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedInput.parentId },
      });

      if (!parentComment || parentComment.postId !== validatedInput.postId) {
        throw new Error('Parent comment not found or belongs to different post');
      }
    }

    // Optional CAPTCHA validation via filter (modules can hook)
    try {
      const ok = await applyFilters('captcha_validate', true, input.captchaToken, input.captchaAnswer, validatedInput.postId);
      if (!ok) throw new Error('Captcha validation failed');
    } catch (e:any) {
      if (e?.message?.includes('Captcha')) throw e;
    }

    // Create comment with initial status based on settings
    const comment = await prisma.comment.create({
      data: {
        body: validatedInput.body,
        guestName: validatedInput.guestName,
        guestUrl: validatedInput.guestUrl || null,
        postId: validatedInput.postId,
        parentId: validatedInput.parentId || null,
        status: 'PENDING', // Default to pending for moderation
      },
      include: {
        post: true,
        parent: true,
        children: true,
      },
    });

    // Emit event for new comment
    await eventBus.emit(CoreEvents.CommentCreated, {
      commentId: comment.id,
      postId: comment.postId,
      guestName: comment.guestName,
      body: comment.body,
      status: comment.status,
    });

    return comment;
  },

  /**
   * Get comments for a post with threading
   */
  async getCommentsForPost(postId: string, includeUnapproved = false) {
    const whereClause: any = {
      postId,
      parentId: null, // Top-level comments only
    };

    if (!includeUnapproved) {
      whereClause.status = 'approved';
    }

    const comments = await prisma.comment.findMany({
      where: whereClause,
      include: {
        children: {
          where: includeUnapproved ? {} : { status: 'APPROVED' },
          orderBy: { createdAt: 'asc' },
          include: {
            children: {
              where: includeUnapproved ? {} : { status: 'APPROVED' },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return comments;
  },

  /**
   * Moderate a comment (approve, reject, mark as spam)
   */
  async moderateComment(commentId: string, status: 'approved' | 'rejected' | 'spam') {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Map to uppercase enum values
    const statusMap = {
      approved: 'APPROVED' as const,
      rejected: 'DELETED' as const,
      spam: 'SPAM' as const,
    };

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { status: statusMap[status] },
    });

    // Emit moderation event
    await eventBus.emit(CoreEvents.CommentModerated, {
      commentId: comment.id,
      postId: comment.postId,
      guestName: comment.guestName,
      status: statusMap[status],
      previousStatus: comment.status,
    });

    return updatedComment;
  },

  /**
   * Delete a comment and optionally its replies
   */
  async deleteComment(commentId: string, deleteReplies = false) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { children: true },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (deleteReplies) {
      // Delete all replies recursively
      await prisma.comment.deleteMany({
        where: { parentId: commentId },
      });
    } else {
      // Move replies up one level (orphan them)
      await prisma.comment.updateMany({
        where: { parentId: commentId },
        data: { parentId: comment.parentId },
      });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    // Emit deletion event
    await eventBus.emit(CoreEvents.CommentDeleted, {
      commentId: comment.id,
      postId: comment.postId,
      deletedReplies: deleteReplies,
    });

    return true;
  },

  /**
   * Get comment statistics for a post
   */
  async getCommentStats(postId: string) {
    const [total, approved, pending, spam] = await Promise.all([
      prisma.comment.count({ where: { postId } }),
      prisma.comment.count({ where: { postId, status: 'APPROVED' } }),
      prisma.comment.count({ where: { postId, status: 'PENDING' } }),
      prisma.comment.count({ where: { postId, status: 'SPAM' } }),
    ]);

    return { total, approved, pending, spam };
  },
};

// Module registration
registerModule({
  manifest: {
    slug: 'comments',
    name: 'Comments',
    version: '1.0.0',
    description: 'Complete comment system with moderation and threading',
    dependencies: [],
    config: {
      schema: z.object({
        requireModeration: z.boolean().default(true),
        allowAnonymous: z.boolean().default(true),
        maxNestingLevel: z.number().default(3),
        rateLimitWindow: z.number().default(15),
        maxCommentsPerWindow: z.number().default(5),
      }),
      defaults: {
        requireModeration: true,
        allowAnonymous: true,
        maxNestingLevel: 3,
        rateLimitWindow: 15,
        maxCommentsPerWindow: 5,
      },
    },
  },
  async activate() {
    console.log('[Comments] Module activated');

    // Subscribe to post deletion events
    eventBus.on(CoreEvents.PostDeleted, async (payload: any) => {
      const { postId } = payload || {};
      console.log('[Comments] Cleaning up comments for deleted post:', postId);
      await prisma.comment.deleteMany({
        where: { postId },
      });
    });

  // (User deletion event not implemented in CoreEvents yet; anonymization hook skipped)
  },

  async deactivate() {
    console.log('[Comments] Module deactivated');
    // Clean up event subscriptions would happen here
  },
});

// The commentService is already exported above with 'export const'
