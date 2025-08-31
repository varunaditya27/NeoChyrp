/* eslint-disable import/order */
/**
 * REST-style route handler for posts collection.
 * - GET: list posts (public, paginated) -> TODO filters.
 * - POST: create draft/published post (auth stub currently).
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { prisma } from '@/src/lib/db';
import { createPost } from '@/src/modules/content/application/commands/createPost';

export async function GET() {
  const posts = await prisma.post.findMany({ take: 20, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  // TODO: AuthN + AuthZ
  const data = await req.json();
  const result = await createPost({
    title: data.title,
    body: data.body,
    authorId: 'owner', // placeholder; replace with session user id.
    feather: data.feather || 'TEXT',
    featherData: data.featherData,
    visibility: data.visibility || 'DRAFT',
    publishNow: data.publishNow
  });
  return NextResponse.json(result, { status: 201 });
}
