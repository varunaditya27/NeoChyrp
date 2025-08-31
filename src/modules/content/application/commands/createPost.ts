/**
 * createPost command handler:
 * - Validates input.
 * - Persists record via Prisma.
 * - Triggers PostPublished event if publishedAt is immediate.
 * - Returns canonical slug + id.
 */
import { prisma } from '@/src/lib/db';

import { EventTypes } from '../../domain/events';
// TODO: wire actual event dispatcher.

interface CreatePostInput {
  title?: string;
  body?: string;
  authorId: string;
  feather: string; // FeatherType
  featherData?: unknown;
  visibility?: string; // PostVisibility
  publishNow?: boolean;
}

export async function createPost(input: CreatePostInput) {
  // TODO: schema validation (zod) + slug generation + excerpt extraction.
  const now = new Date();
  const slug = 'temp-slug'; // placeholder
  const post = await prisma.post.create({
    data: {
      slug,
      title: input.title,
      authorId: input.authorId,
      body: input.body,
      feather: input.feather as any,
      featherData: input.featherData as any,
      visibility: (input.visibility || 'DRAFT') as any,
      publishedAt: input.publishNow ? now : null
    }
  });

  if (post.publishedAt) {
    // dispatch event placeholder
    console.log(EventTypes.PostPublished, { postId: post.id });
  }
  return { id: post.id, slug: post.slug };
}
