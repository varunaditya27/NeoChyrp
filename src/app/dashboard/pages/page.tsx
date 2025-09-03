import Link from 'next/link';

import { Container } from '@/src/components/layout/Container';
import { prisma } from '@/src/lib/db';

export const dynamic = 'force-dynamic';

export default async function PagesListPage() {
  const pages = await prisma.page.findMany({ orderBy: { createdAt: 'desc' }, take: 25, include: { author: true } });
  return (
    <div className="py-8">
      <Container>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Pages</h1>
          <Link href="/dashboard/pages/new" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">New Page</Link>
        </div>
        {pages.length === 0 ? <p className="text-sm text-gray-500">No pages yet.</p> : (
          <div className="overflow-x-auto rounded border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-600">Title</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Author</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Created</th>
                </tr>
              </thead>
              <tbody>
                {pages.map(pg => (
                  <tr key={pg.id} className="border-t last:border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{pg.title}</td>
                    <td className="px-4 py-2 text-gray-700">{pg.author?.displayName || pg.author?.username}</td>
                    <td className="px-4 py-2"><span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize">{pg.visibility.toLowerCase()}</span></td>
                    <td className="px-4 py-2 text-gray-500">{pg.createdAt.toLocaleDateString()}</td>
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
