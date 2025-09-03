/**
 * Posts by tag API
 */

import { z } from 'zod';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { tagService } from '../../../../../modules/tags';

const TagPostsSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(50).optional(),
});

/**
 * GET /api/tags/[slug]/posts
 * Get posts for a specific tag
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const { page: validPage, limit: validLimit } = TagPostsSchema.parse({
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 10 : limit,
    });

    const result = await tagService.getTagPosts(
      params.slug,
      validPage,
      validLimit
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch tag posts:', error);

    if (error instanceof Error && error.message === 'Tag not found') {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch tag posts' },
      { status: 500 }
    );
  }
}
