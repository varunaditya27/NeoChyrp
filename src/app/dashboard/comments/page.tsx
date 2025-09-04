import Link from 'next/link';

import { Container } from '@/src/components/layout/Container';
import { prisma } from '@/src/lib/db';

export const dynamic = 'force-dynamic';

async function moderateComment(formData: FormData): Promise<void> {
  'use server';
  const id = String(formData.get('id'));
  const action = String(formData.get('action')) as 'approve' | 'spam' | 'delete';
  if (!id || !action) return;
  try {
    const base = process.env.SITE_URL || 'http://localhost:3000';
    await fetch(base + '/api/comments/moderate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, action })
    });
  } catch {
    // swallow – UI will reflect on next render
  }
}

export default async function CommentsPage() {
  const comments = await prisma.comment.findMany({ orderBy: { createdAt: 'desc' }, take: 50, include: { post: true, author: true } });
  return (
    <div className="py-8">
      <Container>
        <h1 className="mb-6 text-2xl font-bold">Comments</h1>
        {comments.length === 0 ? <p className="text-sm text-gray-500">No comments.</p> : (
          <div className="overflow-x-auto rounded border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-600">Excerpt</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Post</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Author</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {comments.map(c => (
                  <tr key={c.id} className="border-t last:border-b">
                    <td className="max-w-xs truncate px-4 py-2">{c.body.slice(0, 80)}</td>
                    <td className="px-4 py-2"><Link href={`/blog/${c.post.slug}`} className="text-blue-600 hover:underline">{c.post.title || '(untitled)'}</Link></td>
                    <td className="px-4 py-2 text-gray-700">{c.author?.displayName || c.guestName || 'Guest'}</td>
                    <td className="px-4 py-2"><span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize">{c.status.toLowerCase()}</span></td>
                    <td className="space-x-2 px-4 py-2">
                      <form action={moderateComment} className="inline">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="action" value="approve" />
                        <button className="text-green-600 hover:underline" disabled={c.status === 'APPROVED'}>Approve</button>
                      </form>
                      <form action={moderateComment} className="inline">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="action" value="spam" />
                        <button className="text-yellow-600 hover:underline" disabled={c.status === 'SPAM'}>Spam</button>
                      </form>
                      <form action={moderateComment} className="inline">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="action" value="delete" />
                        <button className="text-red-600 hover:underline" disabled={c.status === 'DELETED'}>Delete</button>
                      </form>
                    </td>
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
