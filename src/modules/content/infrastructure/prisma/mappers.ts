/**
 * Mapping utilities between Prisma models and domain entities / DTOs.
 * - Centralizes transformation logic (e.g., markdown -> HTML, excerpt generation).
 */
import type { Post } from '@prisma/client';

export function toPostDTO(post: Post) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    feather: post.feather,
    excerpt: post.excerpt ?? '',
    publishedAt: post.publishedAt?.toISOString() ?? null
  };
}
