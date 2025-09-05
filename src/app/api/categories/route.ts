/**
 * Categories API Routes
 * Handles CRUD operations for categories and hierarchical management
 */

import { NextResponse, type NextRequest } from 'next/server';

import { getRequestUser } from '@/src/lib/auth/requestUser';

import { categoriesService, CategorySchema } from '../../../modules/categories';


// Request schemas
const CreateCategorySchema = CategorySchema;
const UpdateCategorySchema = CategorySchema.partial();

/**
 * GET /api/categories
 * Get all categories or category tree
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'tree'; // 'tree', 'flat', 'popular'
    const limit = parseInt(searchParams.get('limit') || '50');

    if (format === 'tree') {
      const categoryTree = await categoriesService.getCategoryTree();
      return NextResponse.json({ success: true, data: categoryTree });
    }

    if (format === 'popular') {
      const popularCategories = await categoriesService.getPopularCategories(limit);
      return NextResponse.json({ success: true, data: popularCategories });
    }

    // Default flat list would go here if needed
    const categoryTree = await categoriesService.getCategoryTree();
    return NextResponse.json({ success: true, data: categoryTree });

  } catch (error) {
    console.error('[Categories API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // TODO: Check if user has permission to create categories
    // if (!hasPermission(user, 'manage_categories')) {
    //   return NextResponse.json(
    //     { success: false, error: 'Insufficient permissions' },
    //     { status: 403 }
    //   );
    // }

    const body = await request.json();
    const validatedData = CreateCategorySchema.parse(body);

    const category = await categoriesService.createCategory(validatedData);

    return NextResponse.json({
      success: true,
      data: category,
      message: 'Category created successfully',
    });

  } catch (error: any) {
    console.error('[Categories API] POST error:', error);

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

    if (error.message?.includes('already exists')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories
 * Update a category
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const validatedData = UpdateCategorySchema.parse(updateData);
    const category = await categoriesService.updateCategory(id, validatedData);

    return NextResponse.json({
      success: true,
      data: category,
      message: 'Category updated successfully',
    });

  } catch (error: any) {
    console.error('[Categories API] PUT error:', error);

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

    if (error.message?.includes('already exists')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories
 * Delete a category
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    await categoriesService.deleteCategory(id);

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });

  } catch (error: any) {
    console.error('[Categories API] DELETE error:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    if (error.message?.includes('Cannot delete category with')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
