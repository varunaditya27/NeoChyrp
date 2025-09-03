import '@/src/lib/bootstrap';
import { ok, failure } from '@/src/lib/api/respond';
import { prisma } from '@/src/lib/db';
import { featherRegistry } from '@/src/lib/feathers/registry';
import { postViewsService } from '@/src/modules/post_views';
import { rightsService } from '@/src/modules/rights';

import type { NextRequest } from 'next/server';

// Relax context typing to satisfy evolving Next.js type expectations.
export async function GET(req: NextRequest, context: any) {
  try {
  const raw = (context && context.params) ? await context.params : {};
  const id = raw.id || context?.params?.id;
  if (!id) return failure('Missing id', 400);
    const { searchParams } = new URL(req.url);
    const render = searchParams.get('render') === '1';
    const countView = searchParams.get('track') === '1';

  const post = await prisma.post.findUnique({ where: { id: String(id) } });
    if (!post) return failure('Not found', 404);

    let html: string | undefined;
    if (render && post.feather && post.featherData) {
      try { html = await featherRegistry.renderPost(post.feather, post.featherData); } catch {/* ignore */}
    }

    if (countView) {
      // naive IP retrieval (header fallback)
  const xf = req.headers.get('x-forwarded-for');
  const first = xf ? xf.split(',')[0] : undefined;
  const ip = first ? first.trim() : '0.0.0.0';
      postViewsService.registerView(post.id, ip).catch(()=>{});
    }

  const attribution = await rightsService.getAttribution(post.id);
  return ok({ id: post.id, slug: post.slug, title: post.title, excerpt: post.excerpt, feather: post.feather, featherData: post.featherData, html, publishedAt: post.publishedAt, attribution });
  } catch (e:any) {
    return failure(e.message || 'Error', 500);
  }
}
