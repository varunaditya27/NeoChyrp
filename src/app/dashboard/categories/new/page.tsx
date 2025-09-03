import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { Container } from '@/src/components/layout/Container';
import { prisma } from '@/src/lib/db';
import { uniqueCategorySlug } from '@/src/lib/slug';


const schema = z.object({ name: z.string().min(1) });

async function createCategory(formData: FormData): Promise<void> {
  'use server';
  const parsed = schema.safeParse({ name: formData.get('name') });
  if (!parsed.success) return;
  const slug = await uniqueCategorySlug(parsed.data.name);
  await prisma.category.create({ data: { name: parsed.data.name, slug } });
  revalidatePath('/dashboard/categories');
}

export default function NewCategoryPage() {
  return (
    <div className="py-8">
      <Container>
        <h1 className="mb-6 text-2xl font-bold">New Category</h1>
        <form action={createCategory} className="max-w-md space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input name="name" required className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Create</button>
            <a href="/dashboard/categories" className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancel</a>
          </div>
        </form>
      </Container>
    </div>
  );
}
