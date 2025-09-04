import { prisma } from '@/src/lib/db';
import { settingsService } from '@/src/lib/settings/service';

function xmlEscape(s: string) { return s.replace(/[&<>]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;' }[c] as string)); }

export async function generateRssFeed(limit = 25) {
  const { title, tagline } = await settingsService.getSiteSettings();
  const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
  const posts = await prisma.post.findMany({ where: { visibility: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' }, take: limit });
  const items = posts.map(p => `<item><title>${xmlEscape(p.title||'Untitled')}</title><link>${siteUrl}/post/${p.slug}</link><guid>${p.id}</guid><pubDate>${(p.publishedAt||p.createdAt).toUTCString()}</pubDate><description>${xmlEscape((p.excerpt||'').slice(0,300))}</description></item>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${xmlEscape(title)}</title><link>${siteUrl}</link><description>${xmlEscape(tagline||'')}</description>${items}</channel></rss>`;
}

export async function generateTagRss(slug: string, limit=20) {
  const { title } = await settingsService.getSiteSettings();
  const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
  const posts = await prisma.post.findMany({ where: { visibility:'PUBLISHED', tags: { some: { tag: { slug } } } }, orderBy:{ publishedAt:'desc' }, take: limit });
  const items = posts.map(p => `<item><title>${xmlEscape(p.title||'Untitled')}</title><link>${siteUrl}/post/${p.slug}</link><guid>${p.id}</guid><pubDate>${(p.publishedAt||p.createdAt).toUTCString()}</pubDate><description>${xmlEscape((p.excerpt||'').slice(0,300))}</description></item>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${xmlEscape(title)} - Tag: ${xmlEscape(slug)}</title><link>${siteUrl}/tags/${slug}</link><description>Posts tagged ${xmlEscape(slug)}</description>${items}</channel></rss>`;
}

export async function generateCommentsFeed(limit=40) {
  const { title } = await settingsService.getSiteSettings();
  const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
  const comments = await prisma.comment.findMany({ where: { status: 'APPROVED' }, orderBy:{ createdAt:'desc' }, take: limit, include:{ post:true } });
  const items = comments.map(c => `<entry><id>${c.id}</id><title>${xmlEscape(c.post?.title||'Untitled')}</title><link href='${siteUrl}/post/${c.post?.slug}#comment-${c.id}'/><updated>${c.createdAt.toISOString()}</updated><summary>${xmlEscape(c.body.slice(0,280))}</summary></entry>`).join('');
  return `<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns='http://www.w3.org/2005/Atom'><title>${xmlEscape(title)} - Recent Comments</title><link href='${siteUrl}/api/feed/comments' rel='self'/><link href='${siteUrl}'/>${items}</feed>`;
}
