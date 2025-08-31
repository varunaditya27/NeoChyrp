/**
 * PostCard component:
 * - Presentational summary for a post (list/feed usage).
 * - Accepts a minimal DTO (avoid heavy data requirements).
 */
interface PostCardProps {
  post: { id: string; slug: string; title?: string | null; excerpt?: string | null; feather: string; publishedAt?: string | null };
}

export function PostCard({ post }: PostCardProps) {
  return (
  <article className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold">
        <a href={`/blog/${post.slug}`}>{post.title || '(untitled)'}</a>
      </h3>
      {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-neutral-600">{post.excerpt}</p>}
  <div className="mt-3 flex gap-2 text-xs text-neutral-400">
        <span>{post.feather.toLowerCase()}</span>
        {post.publishedAt && <time dateTime={post.publishedAt}>{new Date(post.publishedAt).toLocaleDateString()}</time>}
      </div>
    </article>
  );
}
