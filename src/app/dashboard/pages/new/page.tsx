import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { Container } from '@/src/components/layout/Container';
import { MarkdownEditor } from '@/src/components/markdown/MarkdownEditor';
import { prisma } from '@/src/lib/db';
import { uniquePageSlug } from '@/src/lib/slug';


const schema = z.object({ title: z.string().min(1), body: z.string().min(1), status: z.enum(['DRAFT','PUBLISHED']).default('DRAFT') });

async function createPage(formData: FormData): Promise<void> {
  'use server';
  const parsed = schema.safeParse({ title: formData.get('title'), body: formData.get('body'), status: formData.get('status') || 'DRAFT' });
  if (!parsed.success) return;
  const author = await prisma.user.findFirst();
  if (!author) return;
  const slug = await uniquePageSlug(parsed.data.title);
  await prisma.page.create({ data: { slug, title: parsed.data.title, body: parsed.data.body, authorId: author.id, visibility: parsed.data.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT' } });
  revalidatePath('/dashboard/pages');
}

export default function NewPagePage() {
  return (
    <div className="py-8">
      <Container>
        <h1 className="mb-6 text-2xl font-bold">New Page</h1>
        <form action={createPage} className="max-w-2xl space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input name="title" required className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Body (Markdown)</label>
            <MarkdownEditor name="body" required aria-label="Page body markdown editor" description="Use Markdown. Supports headings, lists, code fences, links, tables." />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select name="status" className="rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Publish</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Create</button>
            <a href="/dashboard/pages" className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancel</a>
          </div>
          <p className="text-xs text-gray-500">First user in DB is used as author (placeholder).</p>
        </form>
      </Container>
    </div>
  );
}
