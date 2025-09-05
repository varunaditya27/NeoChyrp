/**
 * Admin Post Detail Page
 * Displays minimal details for a newly created post so redirect after creation doesn't 404.
 * TODO: Expand with edit functionality or preview.
 */
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/src/components/admin/AdminLayout';
import { prisma } from '@/src/lib/db';

interface Params { id: string }

async function getPost(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { username: true, displayName: true } },
    },
  });
}

export default async function AdminPostDetail({ params }: { params: Promise<Params> }) {
  const resolved = await params;
  const post = await getPost(resolved.id);
  if (!post) return notFound();

  return (
    <AdminLayout title={`Post: ${post.title || '(untitled)'}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">{post.title || '(untitled)'}</h1>
          <div className="space-x-2">
            <Link href="/admin/manage" className="text-sm text-blue-600 hover:underline">Back to list</Link>
            <Link href={`/blog/${post.slug}`} className="text-sm text-gray-600 hover:underline" target="_blank" rel="noopener noreferrer">View Public</Link>
          </div>
        </div>
        <div className="rounded border bg-white p-4 text-sm space-y-2">
          <div><span className="font-medium">ID:</span> {post.id}</div>
          <div><span className="font-medium">Slug:</span> {post.slug}</div>
          <div><span className="font-medium">Feather:</span> {post.feather}</div>
          <div><span className="font-medium">Visibility:</span> {post.visibility}</div>
          <div><span className="font-medium">Published At:</span> {post.publishedAt?.toISOString() || '—'}</div>
          <div><span className="font-medium">Author:</span> {post.author?.displayName || post.author?.username}</div>
        </div>
        <div className="rounded border bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">Feather Data</h2>
          <pre className="overflow-auto rounded bg-gray-50 p-3 text-xs">{JSON.stringify(post.featherData, null, 2)}</pre>
        </div>
        {post.body && (
          <div className="rounded border bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-gray-700">Body (truncated)</h2>
            <pre className="overflow-auto rounded bg-gray-50 p-3 text-xs">{post.body.slice(0, 2000)}</pre>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
