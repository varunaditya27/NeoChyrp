import { NextRequest, NextResponse } from 'next/server';

import { webmentionService } from '../../../modules/webmentions';

// Handle incoming webmentions
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    let source: string;
    let target: string;

    if (contentType?.includes('application/x-www-form-urlencoded')) {
      // Standard webmention format
      const formData = await request.formData();
      source = formData.get('source') as string;
      target = formData.get('target') as string;
    } else if (contentType?.includes('application/json')) {
      // JSON format
      const body = await request.json();
      source = body.source;
      target = body.target;
    } else {
      return NextResponse.json(
        { error: 'Invalid content type. Use application/x-www-form-urlencoded or application/json' },
        { status: 400 }
      );
    }

    if (!source || !target) {
      return NextResponse.json(
        { error: 'Both source and target URLs are required' },
        { status: 400 }
      );
    }

    const result = await webmentionService.processWebMention(source, target);

    if (result.ok) {
      return NextResponse.json({
        success: true,
        message: 'WebMention processed successfully',
        id: result.id,
      }, { status: 202 }); // 202 Accepted for async processing
    } else {
      return NextResponse.json(
        { error: result.reason || 'Failed to process webmention' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('[API] Error processing webmention:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get webmentions for a post or site statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const stats = searchParams.get('stats');

    if (stats) {
      // Get webmention statistics
      const statistics = await webmentionService.getWebMentionStats();
      return NextResponse.json({ stats: statistics });
    }

    if (postId) {
      // Get webmentions for a specific post
      const webmentions = await webmentionService.getWebMentionsForPost(postId);
      return NextResponse.json({ webmentions });
    }

    return NextResponse.json(
      { error: 'Specify postId or stats parameter' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[API] Error getting webmentions:', error);
    return NextResponse.json(
      { error: 'Failed to get webmentions' },
      { status: 500 }
    );
  }
}
