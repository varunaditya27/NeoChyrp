/**
 * createPost command handler:
 * - Validates input.
 * - Persists record via Prisma.
 * - Triggers PostPublished event if publishedAt is immediate.
 * - Returns canonical slug + id.
 */
import { z } from 'zod';

import { prisma } from '@/src/lib/db';
import { eventBus, CoreEvents } from '@/src/lib/events';
import { featherRegistry } from '@/src/lib/feathers/registry';
import { uniquePostSlug } from '@/src/lib/slug';
import { rightsService } from '@/src/modules/rights';

// Input validation schema
const CreatePostSchema = z.object({
  title: z.string().min(1).max(180).optional(),
  body: z.string().optional(),
  authorId: z.string(),
  feather: z.string(),
  featherData: z.any().optional(),
  visibility: z.enum(['DRAFT','SCHEDULED','PUBLISHED','PRIVATE','ARCHIVED']).optional(),
  publishNow: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  licenseCode: z.string().optional()
});

type CreatePostInput = z.infer<typeof CreatePostSchema>;

export async function createPost(raw: CreatePostInput) {
  const input = CreatePostSchema.parse(raw);
  const slug = await uniquePostSlug(input.title || 'post');

  // Validate feather payload via registry if available
  if (input.featherData) {
    const validation = featherRegistry.validatePayload(input.feather, input.featherData);
    if (!validation.success) {
      throw new Error(`Feather payload invalid: ${validation.error}`);
    }
  }

  let excerpt: string | undefined;
  if (input.featherData) {
    try {
      excerpt = featherRegistry.generateExcerpt(input.feather, input.featherData as any);
    } catch {
      // fallback later
    }
  }
  if (!excerpt && input.body) {
    excerpt = input.body.replace(/<[^>]+>/g, '').slice(0, 180);
  }

  const now = new Date();
  const publish = input.publishNow || input.visibility === 'PUBLISHED';
  const post = await prisma.post.create({
    data: {
      slug,
      title: input.title,
      authorId: input.authorId,
      body: input.body,
      feather: input.feather as any,
      featherData: input.featherData as any,
      visibility: (input.visibility || (publish ? 'PUBLISHED' : 'DRAFT')) as any,
      publishedAt: publish ? now : null,
      excerpt
    }
  });

  await eventBus.emit(CoreEvents.PostUpdated, { postId: post.id, post });
  if (post.publishedAt) await eventBus.emit(CoreEvents.PostPublished, { postId: post.id, post });

  // Tag association if provided (best effort)
  if (input.tags?.length) {
    try {
      const existingTags = await prisma.tag.findMany({ where: { name: { in: input.tags } } });
      const toCreate = input.tags.filter(t => !existingTags.some(et => et.name === t));
      const created = await prisma.$transaction(toCreate.map(name => prisma.tag.create({ data: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g,'-') } })));
      const finalTags = [...existingTags, ...created];
      await prisma.postTag.createMany({ data: finalTags.map(t => ({ postId: post.id, tagId: t.id })) });
    } catch (e) {
      console.warn('Tag association failed', e);
    }
  }

  if (input.licenseCode) {
    rightsService.ensurePostLicense(post.id, input.licenseCode).catch(()=>{});
  }
  return { id: post.id, slug: post.slug };
}

