import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { requirePermission } from '@/src/lib/permissions';
import { rateLimit } from '@/src/lib/security/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
  await requirePermission(req, 'admin:access');
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0';
  if (!rateLimit('export:'+ip,{ capacity:5, refillPerSec: 0.01 })) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    // Stream basic site data (posts, pages, comments, tags)
    const [posts, pages, comments, tags] = await Promise.all([
      prisma.post.findMany(),
      prisma.page.findMany(),
      prisma.comment.findMany(),
      prisma.tag.findMany()
    ]);
    return NextResponse.json({ data: { posts, pages, comments, tags }, exportedAt: new Date().toISOString() });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function POST(req: Request) {
  try {
  await requirePermission(req, 'admin:access');
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0';
  if (!rateLimit('import:'+ip,{ capacity:5, refillPerSec: 0.01 })) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    const body = await req.json();
  const { posts = [], pages = [], comments = [], tags = [], dryRun = true } = body || {};
  // Import order: tags -> posts -> pages -> comments (foreign keys rely on posts)
  const report:any = { posts: posts.length, pages: pages.length, comments: comments.length, tags: tags.length, dryRun, skipped:{ posts:0, pages:0, comments:0, tags:0 } };
    if (!dryRun) {
      // Basic upsert strategy (id collision skip)
  for (const t of tags) { try { await prisma.tag.create({ data: { ...t, id: t.id } }); } catch { report.skipped.tags++; } }
  for (const p of posts) { try { await prisma.post.create({ data: { ...p, id: p.id } }); } catch { report.skipped.posts++; } }
  for (const pg of pages) { try { await prisma.page.create({ data: { ...pg, id: pg.id } }); } catch { report.skipped.pages++; } }
  for (const c of comments) { try { await prisma.comment.create({ data: { ...c, id: c.id } }); } catch { report.skipped.comments++; } }
      report.imported = true;
    }
    return NextResponse.json({ data: report });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
