import { prisma } from '@/src/lib/db';
import { applyFilters, LegacyFilters } from '@/src/lib/triggers';

export async function getRelatedPosts(postId: string, limit=5) {
  const post = await prisma.post.findUnique({ where:{ id: postId }, include:{ tags:{ include:{ tag:true } } } });
  if (!post) return [];
  const tagIds = post.tags.map(t => t.tagId);
  if (!tagIds.length) return [];
  const candidates = await prisma.post.findMany({ where:{ id:{ not: postId }, visibility:'PUBLISHED', tags:{ some:{ tagId:{ in: tagIds } } } }, take: limit * 2, orderBy:{ publishedAt:'desc' } });
  const trimmed = candidates.slice(0, limit);
  return applyFilters(LegacyFilters.RELATED_POSTS, trimmed, postId);
}
