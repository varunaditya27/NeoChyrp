import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';

import { Container } from '@/src/components/layout/Container';
import { MarkdownEditor } from '@/src/components/markdown/MarkdownEditor';
import { prisma } from '@/src/lib/db';

export const dynamic = 'force-dynamic';

const schema = z.object({
	title: z.string().min(1),
	body: z.string().min(1),
	status: z.enum(['DRAFT','PUBLISHED']).default('DRAFT')
});

async function updatePost(id: string, formData: FormData): Promise<void> {
	'use server';
	const parsed = schema.safeParse({
		title: formData.get('title'),
		body: formData.get('body'),
		status: formData.get('status') || 'DRAFT'
	});
	if (!parsed.success) return;
	await prisma.post.update({ where: { id }, data: { title: parsed.data.title, body: parsed.data.body, visibility: parsed.data.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT' } });
	revalidatePath('/dashboard/posts');
	redirect('/dashboard/posts');
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const post = await prisma.post.findUnique({ where: { id } });
	if (!post) return notFound();
	return (
		<div className="py-8">
			<Container>
				<h1 className="mb-6 text-2xl font-bold">Edit Post</h1>
				<form action={updatePost.bind(null, post.id)} className="max-w-2xl space-y-4">
					<div>
						<label className="mb-1 block text-sm font-medium">Title</label>
						<input name="title" defaultValue={post.title || ''} required className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
					</div>
					<div>
						<label className="mb-1 block text-sm font-medium">Body (Markdown)</label>
						<MarkdownEditor name="body" defaultValue={post.body || ''} required aria-label="Post body markdown editor" description="Use Markdown syntax. Toggle preview to see rendered output." />
					</div>
					<div>
						<label className="mb-1 block text-sm font-medium">Status</label>
						<select name="status" defaultValue={post.visibility === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'} className="rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500">
							<option value="DRAFT">Draft</option>
							<option value="PUBLISHED">Publish</option>
						</select>
					</div>
					<div className="flex gap-3">
						<button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save</button>
						<a href="/dashboard/posts" className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancel</a>
					</div>
				</form>
			</Container>
		</div>
	);
}

