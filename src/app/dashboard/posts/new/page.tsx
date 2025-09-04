import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { Container } from '@/src/components/layout/Container';
import { MarkdownEditor } from '@/src/components/markdown/MarkdownEditor';
import { prisma } from '@/src/lib/db';
import { uniquePostSlug, uniqueTagSlug, uniqueCategorySlug } from '@/src/lib/slug';


const schema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  tags: z.string().optional(),
  categories: z.string().optional(),
  status: z.enum(['DRAFT','PUBLISHED']).default('DRAFT')
});

async function createPost(formData: FormData): Promise<void> {
  'use server';
  const parsed = schema.safeParse({
    title: formData.get('title'),
    body: formData.get('body'),
    tags: formData.get('tags') || undefined,
    categories: formData.get('categories') || undefined,
    status: formData.get('status') || 'DRAFT'
  });
  if (!parsed.success) return;
  // TODO: replace with session user id
  const author = await prisma.user.findFirst();
  if (!author) return;
  const slug = await uniquePostSlug(parsed.data.title);

  const tagNames = (parsed.data.tags || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);
  const categoryNames = (parsed.data.categories || '')
    .split(',')
    .map(c => c.trim())
    .filter(Boolean);

  const tags = [] as { id: string }[];
  for (const name of tagNames) {
    const slug = await uniqueTagSlug(name);
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name, slug }
    });
    tags.push({ id: tag.id });
  }

  const categories = [] as { id: string }[];
  for (const name of categoryNames) {
    const slug = await uniqueCategorySlug(name);
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, slug }
    });
    categories.push({ id: category.id });
  }

  await prisma.post.create({
    data: {
      slug,
      title: parsed.data.title,
      body: parsed.data.body,
      authorId: author.id,
      feather: 'TEXT',
      visibility: parsed.data.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
      tags: { create: tags.map(t => ({ tag: { connect: { id: t.id } } })) },
      categories: { create: categories.map(c => ({ category: { connect: { id: c.id } } })) }
    }
  });
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/posts');
}

export default function NewPostPage() {
  return (
    <div className="py-8">
      <Container>
        <h1 className="mb-6 text-2xl font-bold">New Post</h1>
        <form action={createPost} className="max-w-2xl space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input name="title" required className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Body (Markdown)</label>
            <MarkdownEditor name="body" required aria-label="Post body markdown editor" description="Use Markdown syntax. Ctrl/Cmd+B for bold, I for italics, K for link." />
          </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Tags (comma separated)</label>
                <input name="tags" className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Categories (comma separated)</label>
                <input name="categories" className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
              </div>
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
            <a href="/dashboard/posts" className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancel</a>
          </div>
          <p className="text-xs text-gray-500">First user in DB is used as author (placeholder until auth wired).</p>
        </form>
      </Container>
    </div>
  );
}
