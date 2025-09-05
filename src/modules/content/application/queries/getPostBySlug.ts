/**
 * getPostBySlug query:
 * - Fetches published or draft (if caller authorized) post.
 * - Future: caching layer (Redis/Edge) keyed by slug + updatedAt.
 */
import { prisma } from '@/src/lib/db';

export async function getPostBySlug(slug: string) {
  // TODO: pass current user context for permission gating.
  return prisma.post.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });
}
