import Link from 'next/link';

import { Container } from '@/src/components/layout/Container';
import { prisma } from '@/src/lib/db';

export const dynamic = 'force-dynamic';

export default async function PostsListPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 25,
    include: { author: true, tags: { include: { tag: true } }, categories: { include: { category: true } } }
  });
  return (
    <div className="py-8">
      <Container>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Posts</h1>
          <Link href="/dashboard/posts/new" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">New Post</Link>
        </div>
        {posts.length === 0 ? (
          <p className="text-sm text-gray-500">No posts yet.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-600">Title</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Author</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Tags</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Created</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(p => (
                  <tr key={p.id} className="border-t last:border-b hover:bg-gray-50">
                    <td className="px-4 py-2"><Link href={`/blog/${p.slug}`} className="text-blue-600 hover:underline">{p.title || '(untitled)'}</Link></td>
                    <td className="px-4 py-2 text-gray-700">{p.author?.displayName || p.author?.username}</td>
                    <td className="px-4 py-2"><span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize">{p.visibility.toLowerCase()}</span></td>
                    <td className="max-w-xs truncate px-4 py-2 text-gray-600">{p.tags.map(t => t.tag.name).join(', ')}</td>
                    <td className="px-4 py-2 text-gray-500">{p.createdAt.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </div>
  );
}
