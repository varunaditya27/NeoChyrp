import Link from 'next/link';

import { Container } from '@/src/components/layout/Container';
import { prisma } from '@/src/lib/db';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  return (
    <div className="py-8">
      <Container>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Categories</h1>
          <Link href="/dashboard/categories/new" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">New Category</Link>
        </div>
        {categories.length === 0 ? <p className="text-sm text-gray-500">No categories yet.</p> : (
          <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
            {categories.map(c => (
              <li key={c.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div>
                  <p className="font-medium">{c.name}</p>
                  {c.slug !== c.name && <p className="text-xs text-gray-500">{c.slug}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </div>
  );
}
