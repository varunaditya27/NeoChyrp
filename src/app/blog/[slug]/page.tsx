/**
 * Single Post page (server component):
 * - Renders content by slug. Add incremental static regen later if desired.
 */
import { notFound } from 'next/navigation';

import { ViewTracker } from '@/src/components/analytics/ViewTracker';
import { FeatherRenderer } from '@/src/components/feathers/FeatherRenderer';
import { CommentsThread } from '@/src/components/interactions/CommentsThread';
import { LikeButton } from '@/src/components/interactions/LikeButton';
import { MathJaxLoader } from '@/src/components/math/MathJaxLoader';
import { getRelatedPosts } from '@/src/lib/content/related';
import { renderPost } from '@/src/lib/feathers/post-renderer';
import { getPostBySlug } from '@/src/modules/content/application/queries/getPostBySlug';

interface Params { slug: string }

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);
  if (!post) return notFound();

  const related = await getRelatedPosts(post.id, 5);

  // Render post content using the feather system
  const html = await renderPost({
    id: post.id,
    feather: post.feather,
    featherData: post.featherData,
    body: post.body,
    renderedBody: post.renderedBody,
  });

  return (
    <article className="prose max-w-none">
      <h1>{post.title || '(untitled)'}</h1>
      <div className="text-xs text-neutral-500">{post.publishedAt?.toLocaleDateString()}</div>
      <div className="mt-4 flex items-center gap-4">
        {/* Optimistically pass 0; LikeButton will fetch real data */}
        <LikeButton postId={post.id} />
      </div>

      {/* Render feather content */}
      <div className="mt-6">
        <FeatherRenderer
          html={html}
          featherType={post.feather}
          className="post-content"
        />
      </div>

      <ViewTracker postId={post.id} />
      <MathJaxLoader />
      {related.length > 0 && (
        <section className="mt-12 border-t pt-6">
          <h2 className="mb-4 text-lg font-semibold">Related Posts</h2>
          <ul className="list-disc pl-5">
            {related.map((r:any) => (
              <li key={r.id}><a className="text-blue-600 hover:underline" href={`/blog/${r.slug}`}>{r.title || r.slug}</a></li>
            ))}
          </ul>
        </section>
      )}
      <CommentsThread postId={post.id} />
    </article>
  );
}
