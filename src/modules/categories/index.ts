/**
 * Categories Module
 * -----------------
 * Hierarchical taxonomy system with parent/child relationships.
 * Enforces slug uniqueness and provides category management.
 */

import { z } from 'zod';

import { prisma } from '../../lib/db';
import { eventBus, CoreEvents } from '../../lib/events';
import { registerModule } from '../../lib/modules/registry';

// Category validation schema
export const CategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long'),
  slug: z.string().min(1, 'Category slug is required').max(100, 'Category slug too long'),
  parentId: z.string().cuid().optional(),
});

export type CategoryInput = z.infer<typeof CategorySchema>;

export const categoriesService = {
  /**
   * Create a new category
   */
  async createCategory(input: CategoryInput) {
    const validatedInput = CategorySchema.parse(input);

    // Check if slug is unique
    const existingCategory = await prisma.category.findUnique({
      where: { slug: validatedInput.slug },
    });

    if (existingCategory) {
      throw new Error('A category with this slug already exists');
    }

    // If parent specified, verify it exists
    if (validatedInput.parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: validatedInput.parentId },
      });

      if (!parentCategory) {
        throw new Error('Parent category not found');
      }
    }

    // Create the category
    const category = await prisma.category.create({
      data: {
        name: validatedInput.name,
        slug: validatedInput.slug,
        parentId: validatedInput.parentId || null,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { posts: true },
        },
      },
    });

    // Emit event
    await eventBus.emit(CoreEvents.CategoryCreated, {
      categoryId: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
    });

    return category;
  },

  /**
   * Get hierarchical category tree
   */
  async getCategoryTree() {
    const categories = await prisma.category.findMany({
      include: {
        children: {
          include: {
            children: true,
            _count: {
              select: { posts: true },
            },
          },
        },
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Filter to only root categories (no parent) - children are included via relations
    return categories.filter(cat => !cat.parentId);
  },

  /**
   * Get a single category with details
   */
  async getCategory(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
        posts: {
          include: {
            post: {
              include: {
                author: true,
                _count: {
                  select: { comments: true, likes: true },
                },
              },
            },
          },
          orderBy: {
            post: {
              publishedAt: 'desc',
            },
          },
        },
        _count: {
          select: { posts: true },
        },
      },
    });

    return category;
  },

  /**
   * Update a category
   */
  async updateCategory(id: string, input: Partial<CategoryInput>) {
    const validatedInput = CategorySchema.partial().parse(input);

    // If updating slug, check uniqueness
    if (validatedInput.slug) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          slug: validatedInput.slug,
          NOT: { id },
        },
      });

      if (existingCategory) {
        throw new Error('A category with this slug already exists');
      }
    }

    // If updating parent, verify it exists and prevent circular references
    if (validatedInput.parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: validatedInput.parentId },
      });

      if (!parentCategory) {
        throw new Error('Parent category not found');
      }

      // Prevent setting self as parent
      if (validatedInput.parentId === id) {
        throw new Error('Cannot set category as its own parent');
      }

      // TODO: Add deeper circular reference checking if needed
    }

    const category = await prisma.category.update({
      where: { id },
      data: validatedInput,
      include: {
        parent: true,
        children: true,
        _count: {
          select: { posts: true },
        },
      },
    });

    // Emit event
    await eventBus.emit(CoreEvents.CategoryUpdated, {
      categoryId: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
    });

    return category;
  },

  /**
   * Delete a category
   */
  async deleteCategory(id: string) {
    // Check if category has children
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    if (category.children.length > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    // Remove all post associations
    await prisma.postCategory.deleteMany({
      where: { categoryId: id },
    });

    // Delete the category
    await prisma.category.delete({
      where: { id },
    });

    // Emit event
    await eventBus.emit(CoreEvents.CategoryDeleted, {
      categoryId: id,
      name: category.name,
      postCount: category._count.posts,
    });
  },

  /**
   * Assign post to category
   */
  async assignPostToCategory(postId: string, categoryId: string) {
    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Create association (upsert to handle duplicates)
    await prisma.postCategory.upsert({
      where: {
        postId_categoryId: {
          postId,
          categoryId,
        },
      },
      create: {
        postId,
        categoryId,
      },
      update: {}, // No-op if already exists
    });
  },

  /**
   * Remove post from category
   */
  async removePostFromCategory(postId: string, categoryId: string) {
    await prisma.postCategory.delete({
      where: {
        postId_categoryId: {
          postId,
          categoryId,
        },
      },
    });
  },

  /**
   * Get posts by category
   */
  async getPostsByCategory(categorySlug: string, page = 1, limit = 10) {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    const posts = await prisma.post.findMany({
      where: {
        categories: {
          some: {
            categoryId: category.id,
          },
        },
        visibility: 'PUBLISHED',
      },
      include: {
        author: true,
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.post.count({
      where: {
        categories: {
          some: {
            categoryId: category.id,
          },
        },
        visibility: 'PUBLISHED',
      },
    });

    return {
      posts,
      total,
      category,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  },

  /**
   * Get popular categories (by post count)
   */
  async getPopularCategories(limit = 10) {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: {
        posts: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return categories.filter(cat => cat._count.posts > 0);
  },
};

// Register the module
registerModule({
  manifest: {
    slug: 'categories',
    name: 'Categories',
    version: '1.0.0',
    description: 'Hierarchical category system for organizing content',
    dependencies: [],
    config: {
      schema: z.object({
        maxDepth: z.number().default(5),
        allowEmpty: z.boolean().default(true),
        enforceUniqueSlugs: z.boolean().default(true),
        autoSlug: z.boolean().default(true),
      }),
      defaults: {
        maxDepth: 5,
        allowEmpty: true,
        enforceUniqueSlugs: true,
        autoSlug: true,
      },
    },
  },

  config: {
    maxDepth: 5,
    allowEmpty: true,
    enforceUniqueSlugs: true,
    autoSlug: true,
  },

  async activate() {
    console.log('[Categories] Module activated');

    // Subscribe to post deletion events to clean up associations
    eventBus.on(CoreEvents.PostDeleted, async (payload: any) => {
      const { postId } = payload || {};
      console.log('[Categories] Cleaning up categories for deleted post:', postId);

      await prisma.postCategory.deleteMany({
        where: { postId },
      });
    });
  },

  async deactivate() {
    console.log('[Categories] Module deactivated');
    // Event subscriptions are cleaned up automatically by the module registry
  },
});
