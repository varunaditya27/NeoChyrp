/* eslint-disable import/order */
/**
 * REST-style route handler for posts collection.
 * - GET: list posts (public, paginated) -> TODO filters.
 * - POST: create draft/published post (auth stub currently).
 */
import type { NextRequest } from 'next/server';
import { prisma } from '@/src/lib/db';
import { createPost } from '@/src/modules/content/application/commands/createPost';
import '@/src/lib/bootstrap';
import '@/src/feathers/text';
import '@/src/feathers/photo';
import '@/src/feathers/quote';
import '@/src/feathers/link';
import '@/src/feathers/video';
import '@/src/feathers/audio';
import '@/src/feathers/uploader';
import { ok, created, failure } from '@/src/lib/api/respond';
import { featherRegistry } from '@/src/lib/feathers/registry';
import { memoryCache } from '@/src/lib/cache/memory';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const render = searchParams.get('render') === '1';
  const tag = searchParams.get('tag');
  const author = searchParams.get('author');
  const feather = searchParams.get('feather');
  const useCache = searchParams.get('cache') === '1';

  const cacheKey = `posts:list:v1:${render}:${tag||''}:${author||''}:${feather||''}`;
  if (useCache) {
    const cached = memoryCache.get(cacheKey);
    if (cached) return ok(cached as any, { total: (cached as any)?.length });
  }

  const where:any = {};
  if (author) where.authorId = author;
  if (feather) where.feather = feather;
  if (tag) {
    where.tags = { some: { tag: { name: tag } } };
  }

  const posts = await prisma.post.findMany({
    where,
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: render ? { } : undefined
  });

  const list = await Promise.all(posts.map(async p => {
    let html: string | undefined;
    if (render && p.feather && p.featherData) {
      try { html = await featherRegistry.renderPost(p.feather, p.featherData); } catch {/* ignore */}
    }
    return { id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt, publishedAt: p.publishedAt, feather: p.feather, html };
  }));

  if (useCache) memoryCache.set(cacheKey, list, { ttlSeconds: 120, tags: ['posts'] });
  return ok(list, { total: list.length });
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await createPost({
      title: data.title,
      body: data.body,
      authorId: data.authorId || 'owner', // TODO: derive from session
      feather: data.feather || 'TEXT',
      featherData: data.featherData,
      visibility: data.visibility || 'DRAFT',
      publishNow: !!data.publishNow,
  tags: data.tags,
  licenseCode: data.licenseCode
    });
    return created(result);
  } catch (e:any) {
    return failure(e.message || 'Failed to create post', e.status || 400);
  }
}
