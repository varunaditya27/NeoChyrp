/**
 * Individual Category Page
 * Shows posts in a specific category and its subcategories
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { prisma } from '@/src/lib/db';
import { PostCard } from '@/src/modules/content/ui/PostCard';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

// Loading component
function CategoryPostsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200"></div>
        <div className="h-6 w-64 animate-pulse rounded bg-gray-200"></div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-lg bg-gray-200"></div>
        ))}
      </div>
    </div>
  );
}

// Category Posts Component
async function CategoryPosts({ slug, page }: { slug: string; page: number }) {
  const limit = 12;
  const offset = (page - 1) * limit;

  try {
    // Get category details
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: {
          include: {
            children: true,
          },
        },
      },
    });

    if (!category) {
      notFound();
    }

    // Get all category IDs (including children)
    const getAllCategoryIds = (cat: any): string[] => {
      let ids = [cat.id];
      if (cat.children) {
        cat.children.forEach((child: any) => {
          ids = ids.concat(getAllCategoryIds(child));
        });
      }
      return ids;
    };

    const categoryIds = getAllCategoryIds(category);

    // Get posts for this category and its subcategories
    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: {
          categories: {
            some: {
              categoryId: {
                in: categoryIds,
              },
            },
          },
          visibility: 'PUBLISHED',
        },
        include: {
          author: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      prisma.post.count({
        where: {
          categories: {
            some: {
              categoryId: {
                in: categoryIds,
              },
            },
          },
          visibility: 'PUBLISHED',
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return (
      <div className="space-y-8">
        {/* Category Header */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-green-100 p-3">
              <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
              <div className="flex items-center space-x-2 text-gray-600">
                <span>{totalCount} {totalCount === 1 ? 'post' : 'posts'}</span>
                {category.children.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{category.children.length} {category.children.length === 1 ? 'subcategory' : 'subcategories'}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/" className="text-gray-400 hover:text-gray-500">
                Home
              </Link>
            </li>
            <li>
              <svg className="h-5 w-5 flex-shrink-0 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>
            </li>
            <li>
              <Link href="/categories" className="text-gray-400 hover:text-gray-500">
                Categories
              </Link>
            </li>
            {category.parent && (
              <>
                <li>
                  <svg className="h-5 w-5 flex-shrink-0 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                </li>
                <li>
                  <Link href={`/categories/${category.parent.slug}`} className="text-gray-400 hover:text-gray-500">
                    {category.parent.name}
                  </Link>
                </li>
              </>
            )}
            <li>
              <svg className="h-5 w-5 flex-shrink-0 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>
            </li>
            <li>
              <span className="text-gray-500">{category.name}</span>
            </li>
          </ol>
        </nav>

        {/* Subcategories */}
        {category.children.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Subcategories</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.children.map((subcategory) => (
                <Link
                  key={subcategory.id}
                  href={`/categories/${subcategory.slug}`}
                  className="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-green-300 hover:shadow-md"
                >
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-green-100 p-2 group-hover:bg-green-200">
                      <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 group-hover:text-green-600">
                        {subcategory.name}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Posts Grid */}
        {posts && posts.length > 0 ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Posts</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={{
                    id: post.id,
                    slug: post.slug,
                    title: post.title,
                    excerpt: post.excerpt,
                    feather: post.feather,
                    publishedAt: post.publishedAt?.toISOString(),
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-300">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No posts found</h3>
            <p className="mt-2 text-sm text-gray-500">
              There are no published posts in &quot;{category.name}&quot; yet.
            </p>
            <Link
              href="/categories"
              className="mt-4 inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Browse all categories
            </Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 pt-6">
            <div className="flex flex-1 justify-between sm:hidden">
              {page > 1 && (
                <Link
                  href={`/categories/${slug}?page=${page - 1}`}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/categories/${slug}?page=${page + 1}`}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{page}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  {page > 1 && (
                    <Link
                      href={`/categories/${slug}?page=${page - 1}`}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  )}

                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                    const pageNum = i + 1;
                    const isCurrentPage = pageNum === page;

                    return (
                      <Link
                        key={pageNum}
                        href={`/categories/${slug}?page=${pageNum}`}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          isCurrentPage
                            ? 'z-10 bg-green-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {pageNum}
                      </Link>
                    );
                  })}

                  {page < totalPages && (
                    <Link
                      href={`/categories/${slug}?page=${page + 1}`}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  )}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error loading category posts:', error);
    return (
      <div className="text-center py-12">
        <h3 className="mt-4 text-lg font-medium text-gray-900">Error loading posts</h3>
        <p className="mt-2 text-sm text-gray-500">
          There was an error loading posts for this category. Please try again later.
        </p>
        <Link
          href="/categories"
          className="mt-4 inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Browse all categories
        </Link>
      </div>
    );
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || '1', 10);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <Suspense fallback={<CategoryPostsLoading />}>
          <CategoryPosts slug={slug} page={page} />
        </Suspense>
      </div>
    </div>
  );
}
