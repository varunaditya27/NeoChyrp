/**
 * Category Detail API Routes
 * Handles individual category operations and post management
 */

import { NextResponse, type NextRequest } from 'next/server';

import { categoriesService } from '../../../../modules/categories';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/categories/[slug]
 * Get a single category with its posts
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const include = searchParams.get('include') || 'posts'; // 'posts', 'details', 'both'

    if (include === 'posts' || include === 'both') {
      // Get category with posts
      const result = await categoriesService.getPostsByCategory(slug, page, limit);
      return NextResponse.json({ success: true, data: result });
    } else {
      // Get category details only
      const category = await categoriesService.getCategory(slug);
      if (!category) {
        return NextResponse.json(
          { success: false, error: 'Category not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: category });
    }

  } catch (error: any) {
    console.error('[Category Detail API] GET error:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}
