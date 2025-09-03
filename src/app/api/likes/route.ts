/**
 * Likes API Routes
 * Handles like/unlike operations and statistics
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { likeService } from '../../../modules/likes';

import type { NextRequest } from 'next/server';


// Request schemas
const ToggleLikeSchema = z.object({
  postId: z.string().uuid('Valid post ID is required'),
  userId: z.string().uuid('Valid user ID is required'),
});

// Simple session mock - replace with actual auth later
async function getSession(): Promise<any> {
  // TODO: Implement actual session management
  return null;
}

/**
 * GET /api/likes
 * Get like status, count, or likers for a post
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const action = searchParams.get('action') || 'status'; // 'status', 'count', 'likers'

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID
    try {
      z.string().uuid().parse(postId);
    } catch {
      return NextResponse.json(
        { error: 'Invalid post ID format' },
        { status: 400 }
      );
    }

    const session = await getSession();

    if (action === 'count') {
      // Get like count
      const count = await likeService.getLikeCount(postId);
      return NextResponse.json({ count });
    } else if (action === 'likers') {
      // Get list of users who liked
      const limit = parseInt(searchParams.get('limit') || '10');
      const likers = await likeService.getLikers(postId, limit);
      return NextResponse.json({ likers });
    } else {
      // Get like status for current user
      if (!session?.user?.id) {
        return NextResponse.json({ liked: false, like: null });
      }
      const status = await likeService.getLikeStatus(session.user.id, postId);
      return NextResponse.json(status);
    }
  } catch (error) {
    console.error('Failed to fetch like data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch like data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/likes
 * Toggle like for a post
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, userId } = ToggleLikeSchema.parse(body);

    const session = await getSession();

    // Check if user is authenticated and matches the userId in request
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const result = await likeService.toggleLike({ userId, postId });

    // Get updated count
    const count = await likeService.getLikeCount(postId);

    return NextResponse.json({
      ...result,
      count,
      message: result.liked ? 'Post liked successfully' : 'Like removed successfully'
    });
  } catch (error) {
    console.error('Failed to toggle like:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}
