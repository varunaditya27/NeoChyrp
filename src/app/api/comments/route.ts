/**
 * Comments API Routes
 * Handles CRUD operations for comments and moderation
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { getDevSession } from '@/src/lib/session/devSession';

import { commentService, CommentSchema } from '../../../modules/comments';



// Request schemas
// Base comment schema + optional captcha transport fields (not stored directly)
const CreateCommentSchema = CommentSchema.extend({
  captchaToken: z.string().optional(),
  captchaAnswer: z.string().optional(),
});

// Use cuid for comment ids (matches DB) instead of uuid
const ModerateCommentSchema = z.object({
  commentId: z.string().cuid(),
  status: z.enum(['approved', 'rejected', 'spam']),
});

// Simple session mock - replace with actual auth later
async function getSession(): Promise<any> { return getDevSession(); }

/**
 * GET /api/comments
 * Get comments for a post
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const includeUnapproved = searchParams.get('includeUnapproved') === 'true';

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Validate ID (cuid)
    try {
      z.string().cuid().parse(postId);
    } catch {
      return NextResponse.json(
        { error: 'Invalid post ID format' },
        { status: 400 }
      );
    }

    // Check if user can see unapproved comments (admin/moderator only)
    let canSeeUnapproved = false;
    if (includeUnapproved) {
      const session = await getSession();
      canSeeUnapproved = session?.user?.role === 'admin' || session?.user?.role === 'moderator';
    }

    // Always show approved comments (all comments are auto-approved now)
    const comments = await commentService.getCommentsForPost(
      postId,
      canSeeUnapproved
    );

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comments
 * Create a new comment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = await getSession();

    // If user is logged in, use their info, otherwise require manual entry
    // Normalize incoming data to CommentSchema shape
    const baseData: any = { ...body };
    if (session?.user) {
      // Override guestName with authenticated user's display name/username
      baseData.guestName = session.user.displayName || session.user.username;
      if (!baseData.guestUrl) baseData.guestUrl = '';
    }
    const validatedData = CreateCommentSchema.parse(baseData);
    // Pass captcha fields through to service (they are stripped from DB input there)
    const comment = await commentService.createComment({
      body: validatedData.body,
      guestName: validatedData.guestName,
      guestUrl: validatedData.guestUrl,
      postId: validatedData.postId,
      parentId: (validatedData as any).parentId,
      captchaToken: validatedData.captchaToken,
      captchaAnswer: validatedData.captchaAnswer,
    });

    return NextResponse.json(
      {
        comment,
        message: 'Comment posted successfully!'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create comment:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/comments
 * Moderate a comment (admin/moderator only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();

    // Check permissions
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { commentId, status } = ModerateCommentSchema.parse(body);

    const comment = await commentService.moderateComment(commentId, status);

    return NextResponse.json({
      comment,
      message: `Comment ${status} successfully`
    });
  } catch (error) {
    console.error('Failed to moderate comment:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to moderate comment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments
 * Delete a comment (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();

    // Check permissions
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    const deleteReplies = searchParams.get('deleteReplies') === 'true';

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    await commentService.deleteComment(commentId, deleteReplies);

    return NextResponse.json({
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
