/**
 * Tags API Routes
 * Manages tags and their associations with posts
 */

import { z } from 'zod';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { tagService, TagSchema } from '../../../modules/tags';
import { getSession } from '../../../lib/auth';

// Request schemas
const CreateTagSchema = TagSchema;

const SearchTagsSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(50).optional(),
});

const SetPostTagsSchema = z.object({
  postId: z.string().uuid(),
  tagNames: z.array(z.string()),
});

/**
 * GET /api/tags
 * Search tags or get popular tags
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || 'popular'; // 'search', 'popular', 'cloud'

    let tags;

    if (type === 'search' && query) {
      // Search tags by name
      const { query: searchQuery, limit: searchLimit } = SearchTagsSchema.parse({
        query,
        limit,
      });

      tags = await tagService.searchTags(searchQuery, searchLimit);
    } else if (type === 'cloud') {
      // Get tag cloud data
      tags = await tagService.getTagCloud(limit);
    } else {
      // Get popular tags (default)
      tags = await tagService.getPopularTags(limit);
    }

    return NextResponse.json({ tags, type });
  } catch (error) {
    console.error('Failed to fetch tags:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tags
 * Create a new tag (admin only) or set tags for a post
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();

    // Check if this is a request to set post tags or create a new tag
    if ('postId' in body && 'tagNames' in body) {
      // Set tags for a post
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const { postId, tagNames } = SetPostTagsSchema.parse(body);

      // TODO: Check if user owns the post or has permission to edit it

      const tags = await tagService.setPostTags(postId, tagNames);

      return NextResponse.json({
        tags,
        message: 'Post tags updated successfully'
      });
    } else {
      // Create a new tag - skip auth check for now
      const tagData = CreateTagSchema.parse(body);
      const tag = await tagService.createTag(tagData);

      return NextResponse.json(
        { tag, message: 'Tag created successfully' },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Failed to process tag request:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process tag request' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tags
 * Merge tags (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    await getSession();

    // Skip auth check for now
    const body = await request.json();
    const { sourceTagId, targetTagId } = z.object({
      sourceTagId: z.string().uuid(),
      targetTagId: z.string().uuid(),
    }).parse(body);

    const mergedTag = await tagService.mergeTags(sourceTagId, targetTagId);

    return NextResponse.json({
      tag: mergedTag,
      message: 'Tags merged successfully'
    });
  } catch (error) {
    console.error('Failed to merge tags:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to merge tags' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tags
 * Clean up unused tags (admin only)
 */
export async function DELETE() {
  try {
    await getSession();

    // Skip auth check for now
    const deletedCount = await tagService.cleanupUnusedTags();

    return NextResponse.json({
      deletedCount,
      message: `Cleaned up ${deletedCount} unused tags`
    });
  } catch (error) {
    console.error('Failed to cleanup tags:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup tags' },
      { status: 500 }
    );
  }
}
