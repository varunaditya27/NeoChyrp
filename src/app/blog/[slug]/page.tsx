/**
 * Single Post page (server component):
 * - Renders content by slug. Add incremental static regen later if desired.
 */
import { notFound } from 'next/navigation';

import { getPostBySlug } from '@/src/modules/content/application/queries/getPostBySlug';

interface Params { slug: string }

export default async function PostPage({ params }: { params: Params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return notFound();
  return (
    <article className="prose max-w-none">
      <h1>{post.title || '(untitled)'}</h1>
      <div className="text-xs text-neutral-500">{post.publishedAt?.toLocaleDateString()}</div>
      {/* TODO: sanitize + render markdown -> HTML safely */}
      <pre className="mt-6 whitespace-pre-wrap rounded bg-neutral-100 p-4 text-sm">{post.body}</pre>
    </article>
  );
}
