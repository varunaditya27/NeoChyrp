/**
 * Categories Page
 * Displays hierarchical category structure with post counts
 */

import Link from 'next/link';
import { Suspense } from 'react';

import { prisma } from '@/src/lib/db';

interface Category {
  id: string;
  name: string;
  slug: string;
  postCount: number;
  children: Category[];
}

// Loading component for categories
function CategoriesLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200"></div>
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200"></div>
        ))}
      </div>
    </div>
  );
}

// Category Tree Component
async function CategoryTree() {
  try {
    // Fetch categories with post counts
    const categories = await prisma.category.findMany({
      where: {
        parentId: null, // Only root categories
      },
      include: {
        children: {
          include: {
            posts: true,
            children: {
              include: {
                posts: true,
              },
            },
          },
        },
        posts: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform the data to include post counts
    const categoriesWithCounts = categories.map((category) => {
      const getPostCount = (cat: any): number => {
        let count = cat.posts?.length || 0;
        if (cat.children) {
          count += cat.children.reduce((sum: number, child: any) => sum + getPostCount(child), 0);
        }
        return count;
      };

      const transformCategory = (cat: any): Category => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        postCount: getPostCount(cat),
        children: cat.children?.map(transformCategory) || [],
      });

      return transformCategory(category);
    });

    if (!categoriesWithCounts || categoriesWithCounts.length === 0) {
      return (
        <div className="py-12 text-center">
          <div className="mx-auto size-24 text-gray-300">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No categories yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Categories will appear here once they are created and posts are assigned to them.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="mt-2 text-gray-600">
            Browse content organized by {categoriesWithCounts.length} categories
          </p>
        </div>

        <div className="space-y-4">
          {categoriesWithCounts.map((category) => (
            <CategoryCard key={category.id} category={category} level={0} />
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading categories:', error);
    return (
      <div className="py-12 text-center">
        <div className="mx-auto size-24 text-red-300">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">Unable to load categories</h3>
        <p className="mt-2 text-sm text-gray-500">
          There was an error loading the categories. Please try again later.
        </p>
      </div>
    );
  }
}

// Category Card Component
function CategoryCard({ category, level }: { category: Category; level: number }) {
  const marginLeft = level * 24; // 24px per level

  return (
    <div className="space-y-2">
      <Link
        href={`/categories/${category.slug}`}
        className="group block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md"
        style={{ marginLeft: `${marginLeft}px` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-green-100 p-2 group-hover:bg-green-200">
              <svg className="size-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                {category.name}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-gray-900">
              {category.postCount} {category.postCount === 1 ? 'post' : 'posts'}
            </span>
            {category.children.length > 0 && (
              <p className="text-xs text-gray-500">
                {category.children.length} {category.children.length === 1 ? 'subcategory' : 'subcategories'}
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Render children */}
      {category.children.map((child) => (
        <CategoryCard key={child.id} category={child} level={level + 1} />
      ))}
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <Suspense fallback={<CategoriesLoading />}>
          <CategoryTree />
        </Suspense>
      </div>
    </div>
  );
}
