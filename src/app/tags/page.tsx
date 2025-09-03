/**
 * Tags Page
 * Displays all available tags with post counts and filtering capabilities
 */

import { Suspense } from 'react';
import Link from 'next/link';

import { tagService } from '@/src/modules/tags';

interface Tag {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

// Loading component for tags
function TagsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200"></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200"></div>
        ))}
      </div>
    </div>
  );
}

// Tag Cloud Component
async function TagCloud() {
  try {
    const tags = await tagService.getTagCloud(50);

    if (!tags || tags.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-300">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2l-2.37.84zM16 7l2 2-2 2V7zM5 7h9v10H5V7z"/>
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No tags yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Tags will appear here once posts are created with tags.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tags</h1>
          <p className="mt-2 text-gray-600">
            Discover content by browsing through {tags.length} tags
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag: Tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                    {tag.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {tag.postCount} {tag.postCount === 1 ? 'post' : 'posts'}
                  </p>
                </div>
                <div className="rounded-full bg-blue-100 p-2 group-hover:bg-blue-200">
                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Popular Tags Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Tags</h2>
          <div className="flex flex-wrap gap-2">
            {tags
              .sort((a, b) => b.postCount - a.postCount)
              .slice(0, 15)
              .map((tag: Tag) => (
                <Link
                  key={tag.id}
                  href={`/tags/${tag.slug}`}
                  className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200"
                >
                  {tag.name}
                  <span className="ml-1 text-xs text-gray-500">({tag.postCount})</span>
                </Link>
              ))}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading tags:', error);
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 text-red-300">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">Unable to load tags</h3>
        <p className="mt-2 text-sm text-gray-500">
          There was an error loading the tags. Please try again later.
        </p>
      </div>
    );
  }
}

export default function TagsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <Suspense fallback={<TagsLoading />}>
          <TagCloud />
        </Suspense>
      </div>
    </div>
  );
}
