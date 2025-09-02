/**
 * Blog index page (server component):
 * - Fetches recent posts (stubbed). Pagination + filters later.
 */
import { prisma } from '@/src/lib/db';
import { PostCard } from '@/src/modules/content/ui/PostCard';

type Post = {
  id: string;
  slug: string;
  title: string;
  feather: string;
  excerpt?: string | null;
  publishedAt?: Date | null;
  createdAt: Date;
};

export default async function BlogIndexPage() {
  // TODO: filter by visibility (only published) + pagination.
  const posts: Post[] = await prisma.post.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {posts.map((p: Post) => (
        <PostCard key={p.id} post={{ id: p.id, slug: p.slug, title: p.title, feather: p.feather, excerpt: p.excerpt ?? undefined, publishedAt: p.publishedAt?.toISOString() }} />
      ))}
      {posts.length === 0 && <p className="col-span-full text-sm text-neutral-500">No posts yet.</p>}
    </div>
  );
}
