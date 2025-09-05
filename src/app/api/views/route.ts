import { NextRequest, NextResponse } from 'next/server';

import { viewsService } from '../../../modules/views';

export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Get visitor information for anonymization
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? (forwarded.split(',')[0]?.trim() || 'unknown') : 'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    const viewCounted = await viewsService.recordView(postId, ipAddress, userAgent);

    return NextResponse.json({
      success: true,
      viewCounted,
      message: viewCounted ? 'View recorded' : 'View not counted (duplicate)'
    });

  } catch (error) {
    console.error('[API] Error recording view:', error);
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const postIds = searchParams.get('postIds');
    const mostViewed = searchParams.get('mostViewed');
    const days = searchParams.get('days');
    const stats = searchParams.get('stats');

    // Get view count for single post
    if (postId) {
      const count = await viewsService.getViewCount(postId);
      return NextResponse.json({ postId, viewCount: count });
    }

    // Get view counts for multiple posts
    if (postIds) {
      const ids = postIds.split(',');
      const counts = await viewsService.getViewCounts(ids);
      return NextResponse.json({ viewCounts: counts });
    }

    // Get most viewed posts
    if (mostViewed) {
      const limit = parseInt(searchParams.get('limit') || '10');
      const daysFilter = days ? parseInt(days) : undefined;
      const posts = await viewsService.getMostViewedPosts(limit, daysFilter);
      return NextResponse.json({ mostViewedPosts: posts });
    }

    // Get view statistics
    if (stats) {
      const daysFilter = days ? parseInt(days) : 30;
      const statistics = await viewsService.getViewStats(daysFilter);
      return NextResponse.json({ stats: statistics });
    }

    return NextResponse.json(
      { error: 'Invalid request. Specify postId, postIds, mostViewed, or stats parameter.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[API] Error getting view data:', error);
    return NextResponse.json(
      { error: 'Failed to get view data' },
      { status: 500 }
    );
  }
}
