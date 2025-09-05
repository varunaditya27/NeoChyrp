import { NextRequest, NextResponse } from 'next/server';

import { canAccessAuthorDashboard } from '@/src/lib/auth/adminAccess';
import { prisma } from '@/src/lib/db';
import { getRequestUser } from '@/src/lib/auth/requestUser';

export async function GET(request: NextRequest) {
  try {
    // Resolve request user
    const reqUser = await getRequestUser(request);
    if (!reqUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!canAccessAuthorDashboard({ role: reqUser.role, username: reqUser.username })) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get author post counts by visibility mapping
    const [totalPosts, publishedPosts, draftPosts] = await Promise.all([
      prisma.post.count({ where: { authorId: reqUser.id } }),
      prisma.post.count({ where: { authorId: reqUser.id, visibility: 'PUBLISHED' } }),
      prisma.post.count({ where: { authorId: reqUser.id, visibility: 'DRAFT' } })
    ]);

    // Total views via PostView join
    const totalViews = await prisma.postView.count({ where: { post: { authorId: reqUser.id } } });

    // Get total comments on author's posts
  const totalComments = await prisma.comment.count({ where: { post: { authorId: reqUser.id } } });

    const stats = {
      totalPosts,
      publishedPosts,
      draftPosts,
  totalViews,
      totalComments
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Author stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch author stats' },
      { status: 500 }
    );
  }
}
