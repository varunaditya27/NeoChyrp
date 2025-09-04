/**
 * Single Post page (server component):
 * - Renders content by slug. Add incremental static regen later if desired.
 */
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';
import { notFound } from 'next/navigation';

import { getRelatedPosts } from '@/src/lib/content/related';
import { getPostBySlug } from '@/src/modules/content/application/queries/getPostBySlug';

interface Params { slug: string }

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);
  if (!post) return notFound();
  const related = await getRelatedPosts(post.id, 5);
  const raw = post.body || '';
  const html = DOMPurify.sanitize(marked.parse(raw) as string);
  return (
    <article className="prose max-w-none">
      <h1>{post.title || '(untitled)'}</h1>
      <div className="text-xs text-neutral-500">{post.publishedAt?.toLocaleDateString()}</div>
      <div className="mt-6" dangerouslySetInnerHTML={{ __html: html }} />
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
    </article>
  );
}
