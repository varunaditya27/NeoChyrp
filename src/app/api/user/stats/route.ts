import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/src/lib/db';
import { getRequestUser } from '@/src/lib/auth/requestUser';

export async function GET(request: NextRequest) {
  try {
  const reqUser = await getRequestUser(request);
  if (!reqUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: reqUser.id },
      select: {
        createdAt: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user stats
    const [commentsCount, likesGiven] = await Promise.all([
      prisma.comment.count({ where: { authorId: reqUser.id } }),
      prisma.like.count({ where: { userId: reqUser.id } })
    ]);

    // Calculate profile completeness
    let completeness = 30; // Base for having an account
    if (user.email && !user.email.includes('@localhost.local')) completeness += 20;
    if (user.displayName) completeness += 20;
    if (user.bio) completeness += 20;
    if (user.avatarUrl) completeness += 10;

    const stats = {
      commentsCount,
      likesGiven,
      joinedDate: user.createdAt,
      profileCompleteness: Math.min(completeness, 100)
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('User stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
