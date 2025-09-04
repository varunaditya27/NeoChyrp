import '@/src/lib/bootstrap';
import { ok, failure } from '@/src/lib/api/respond';
import { prisma } from '@/src/lib/db';
import { postViewsService } from '@/src/modules/post_views';

import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest, context: any) {
  try {
  const raw = (context && context.params) ? await context.params : {};
  const id = raw.id || context?.params?.id;
  if (!id) return failure('Missing id', 400);
  const post = await prisma.post.findUnique({ where: { id: String(id) } });
    if (!post) return failure('Not found', 404);
  const xf = req.headers.get('x-forwarded-for');
  const first = xf ? xf.split(',')[0] : undefined;
  const ip = first ? first.trim() : '0.0.0.0';
    const ua = req.headers.get('user-agent') || undefined;
    const res = await postViewsService.registerView(post.id, ip, ua);
    return ok({ counted: res.counted });
  } catch (e:any) {
    return failure(e.message || 'Error', 500);
  }
}
