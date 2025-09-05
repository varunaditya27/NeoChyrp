/**
 * Admin Stats API
 * Provides dashboard statistics for admin users only
 */

import { NextResponse, type NextRequest } from 'next/server';

import { getRequestUser } from '@/src/lib/auth/requestUser';
import { prisma } from '@/src/lib/db';

import { canAccessAdmin } from '../../../../lib/auth/adminAccess';


export async function GET(request: NextRequest) {
  try {
  // Unified auth token retrieval (supports legacy cookies)
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    if (!user || !canAccessAdmin(user)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Fetch dashboard statistics
    const [postsCount, pagesCount, commentsCount, usersCount, recentPosts] = await Promise.all([
      prisma.post.count(),
      prisma.page.count().catch(() => 0), // Pages might not exist yet
      prisma.comment.count().catch(() => 0), // Comments might not exist yet
      prisma.user.count(),
      prisma.post.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              username: true,
              displayName: true,
            },
          },
        },
      }),
    ]);

    const publishedPosts = await prisma.post.count({
      where: { visibility: 'PUBLISHED' },
    });

    const draftPosts = await prisma.post.count({
      where: { visibility: 'DRAFT' },
    });

    const stats = {
      posts: {
        total: postsCount,
        published: publishedPosts,
        drafts: draftPosts,
        recent: recentPosts,
      },
      pages: {
        total: pagesCount,
        recent: [],
      },
      comments: {
        total: commentsCount,
        pending: 0,
        recent: [],
      },
      users: {
        total: usersCount,
        recent: [],
      },
    };

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
