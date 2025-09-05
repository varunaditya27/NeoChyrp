/**
 * Category Posts API Routes
 * Handles post assignment to categories
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { getDevSession } from '@/src/lib/session/devSession';

import { categoriesService } from '../../../../../modules/categories';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

const AssignPostSchema = z.object({
  postId: z.string().cuid(),
  action: z.enum(['assign', 'remove']).default('assign'),
});

// Simple session mock - replace with actual auth later
async function getSession(): Promise<any> { return getDevSession(); }

/**
 * POST /api/categories/[slug]/posts
 * Assign or remove a post from a category
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const body = await request.json();
    const { postId, action } = AssignPostSchema.parse(body);

    // Get category ID from slug
    const category = await categoriesService.getCategory(slug);
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    if (action === 'assign') {
      await categoriesService.assignPostToCategory(postId, category.id);
      return NextResponse.json({
        success: true,
        message: 'Post assigned to category successfully',
      });
    } else {
      await categoriesService.removePostFromCategory(postId, category.id);
      return NextResponse.json({
        success: true,
        message: 'Post removed from category successfully',
      });
    }

  } catch (error: any) {
    console.error('[Category Posts API] POST error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to manage post category assignment' },
      { status: 500 }
    );
  }
}
