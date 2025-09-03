import Link from 'next/link';

import { Container } from '@/src/components/layout/Container';
import { prisma } from '@/src/lib/db';

export const dynamic = 'force-dynamic';

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  return (
    <div className="py-8">
      <Container>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tags</h1>
          <Link href="/dashboard/tags/new" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">New Tag</Link>
        </div>
        {tags.length === 0 ? <p className="text-sm text-gray-500">No tags yet.</p> : (
          <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
            {tags.map(t => (
              <li key={t.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div>
                  <p className="font-medium">{t.name}</p>
                  {t.slug !== t.name && <p className="text-xs text-gray-500">{t.slug}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </div>
  );
}
