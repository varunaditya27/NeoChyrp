/**
 * PostCard component:
 * Enhanced presentational summary for a post with better design and functionality
 */

import Link from 'next/link';

interface PostCardProps {
  post: {
    id: string;
    slug: string;
    title?: string | null;
    excerpt?: string | null;
    feather: string;
    publishedAt?: string | null;
  };
}

export function PostCard({ post }: PostCardProps) {
  const getFeatherIcon = (feather: string) => {
    const icons = {
      TEXT: (
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      PHOTO: (
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      VIDEO: (
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      AUDIO: (
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
      QUOTE: (
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      LINK: (
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      UPLOADER: (
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    };
    return icons[feather as keyof typeof icons] || icons.TEXT;
  };

  const getFeatherColor = (feather: string) => {
    const colors = {
      TEXT: 'text-blue-600 bg-blue-100',
      PHOTO: 'text-green-600 bg-green-100',
      VIDEO: 'text-red-600 bg-red-100',
      AUDIO: 'text-purple-600 bg-purple-100',
      QUOTE: 'text-yellow-600 bg-yellow-100',
      LINK: 'text-indigo-600 bg-indigo-100',
      UPLOADER: 'text-gray-600 bg-gray-100',
    };
    return colors[feather as keyof typeof colors] || colors.TEXT;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <article className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md">
      <div className="p-6">
        {/* Header with feather type */}
        <div className="mb-3 flex items-center justify-between">
          <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getFeatherColor(post.feather)}`}>
            {getFeatherIcon(post.feather)}
            <span className="ml-1 capitalize">{post.feather.toLowerCase()}</span>
          </div>
          {post.publishedAt && (
            <time
              dateTime={post.publishedAt}
              className="text-xs text-gray-500"
            >
              {formatDate(post.publishedAt)}
            </time>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600">
          <Link href={`/blog/${post.slug}`} className="line-clamp-2">
            {post.title || '(Untitled)'}
          </Link>
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="mb-4 line-clamp-3 text-sm text-gray-600">
            {post.excerpt}
          </p>
        )}

        {/* Read More Link */}
        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex items-center text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-700"
        >
          Read more
          <svg className="ml-1 size-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
