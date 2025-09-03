/**
 * Likes stats API
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { likeService } from '../../../../modules/likes';

import type { NextRequest } from 'next/server';


const StatsSchema = z.object({
  type: z.enum(['trending', 'user']),
  days: z.number().min(1).max(365).optional(),
  limit: z.number().min(1).max(100).optional(),
  userId: z.string().uuid().optional(),
});

/**
 * GET /api/likes/stats
 * Get like statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'trending';
    const days = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');

    const params = StatsSchema.parse({
      type,
      days: isNaN(days) ? 7 : days,
      limit: isNaN(limit) ? 10 : limit,
      userId: userId || undefined,
    });

    if (params.type === 'user') {
      if (!params.userId) {
        return NextResponse.json(
          { error: 'User ID is required for user statistics' },
          { status: 400 }
        );
      }

      const stats = await likeService.getUserLikeStats(params.userId);
      return NextResponse.json({ stats, userId: params.userId });
    } else {
      // Trending posts
      const posts = await likeService.getMostLikedPosts(params.days || 7, params.limit || 10);
      return NextResponse.json({
        posts,
        days: params.days,
        limit: params.limit,
        type: 'trending'
      });
    }
  } catch (error) {
    console.error('Failed to fetch like statistics:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch like statistics' },
      { status: 500 }
    );
  }
}
