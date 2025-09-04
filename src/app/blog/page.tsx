/**
 * Blog index page (server component):
 * Enhanced blog listing with search, filtering, and pagination
 */

import Link from 'next/link';
import { Suspense } from 'react';

import { Container } from '@/src/components/layout/Container';
import { prisma } from '@/src/lib/db';
import { settingsService } from '@/src/lib/settings/service';
import { PostCard } from '@/src/modules/content/ui/PostCard';

interface BlogPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    feather?: string;
  }>;
}

// Loading component
function BlogLoading() {
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

// Blog Posts Component
async function BlogPosts({ page, search, feather }: { page: number; search?: string; feather?: string }) {
  const { postsPerPage } = await settingsService.getSiteSettings();
  const limit = Math.min(Math.max(postsPerPage || 12, 1), 60);
  const offset = (page - 1) * limit;

  try {
    // Build where clause
    const where: any = {
      visibility: 'PUBLISHED',
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (feather) {
      where.feather = feather.toUpperCase();
    }

    // Fetch posts and total count
    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
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
      prisma.post.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Get feather counts for filter
    const featherCounts = await prisma.post.groupBy({
      by: ['feather'],
      where: {
        visibility: 'PUBLISHED',
      },
      _count: {
        feather: true,
      },
    });

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
          <p className="mt-2 text-gray-600">
            {search
              ? `Search results for "${search}" (${totalCount} ${totalCount === 1 ? 'post' : 'posts'})`
              : `Discover ${totalCount} ${totalCount === 1 ? 'post' : 'posts'} across various topics`
            }
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/blog"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              !feather
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Posts
          </Link>
          {featherCounts.map((item) => (
            <Link
              key={item.feather}
              href={`/blog?feather=${item.feather.toLowerCase()}`}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                feather?.toUpperCase() === item.feather
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {item.feather.charAt(0) + item.feather.slice(1).toLowerCase()} ({item._count.feather})
            </Link>
          ))}
        </div>

        {/* Posts Grid */}
        {posts && posts.length > 0 ? (
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
        ) : (
          <div className="py-12 text-center">
            <div className="mx-auto size-24 text-gray-300">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {search ? 'No posts found' : 'No posts yet'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {search
                ? `Try adjusting your search terms or browse all posts.`
                : 'Posts will appear here once they are published.'
              }
            </p>
            {search && (
              <Link
                href="/blog"
                className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                View all posts
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 pt-6">
            <div className="flex flex-1 justify-between sm:hidden">
              {page > 1 && (
                <Link
                  href={`/blog?page=${page - 1}${search ? `&search=${search}` : ''}${feather ? `&feather=${feather}` : ''}`}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/blog?page=${page + 1}${search ? `&search=${search}` : ''}${feather ? `&feather=${feather}` : ''}`}
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
                      href={`/blog?page=${page - 1}${search ? `&search=${search}` : ''}${feather ? `&feather=${feather}` : ''}`}
                      className="relative inline-flex items-center rounded-l-md p-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
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
                        href={`/blog?page=${pageNum}${search ? `&search=${search}` : ''}${feather ? `&feather=${feather}` : ''}`}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          isCurrentPage
                            ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {pageNum}
                      </Link>
                    );
                  })}

                  {page < totalPages && (
                    <Link
                      href={`/blog?page=${page + 1}${search ? `&search=${search}` : ''}${feather ? `&feather=${feather}` : ''}`}
                      className="relative inline-flex items-center rounded-r-md p-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
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
    console.error('Error loading blog posts:', error);
    return (
      <div className="py-12 text-center">
        <h3 className="mt-4 text-lg font-medium text-gray-900">Unable to load posts</h3>
        <p className="mt-2 text-sm text-gray-500">
          There was an error loading the blog posts. Please try again later.
        </p>
      </div>
    );
  }
}

export default async function BlogIndexPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const search = params.search;
  const feather = params.feather;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <Suspense fallback={<BlogLoading />}>
          <BlogPosts page={page} search={search} feather={feather} />
        </Suspense>
      </Container>
    </div>
  );
}
