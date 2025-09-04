import crypto from 'crypto';

import { NextResponse } from 'next/server';

import '@/src/lib/bootstrap';
import { prisma } from '@/src/lib/db';
import { settingsService } from '@/src/lib/settings/service';

export const dynamic = 'force-dynamic';

let atomCache: string | null = null; let atomEtag: string | null = null; let atomTime=0;
export async function GET(req: Request) {
  try {
    const now=Date.now();
    if (!atomCache || (now-atomTime)>5*60*1000) {
      const { title, tagline } = await settingsService.getSiteSettings();
      const posts = await prisma.post.findMany({ where:{ visibility:'PUBLISHED' }, orderBy:{ publishedAt:'desc' }, take:25 });
      const updated = posts[0]?.publishedAt?.toISOString() || new Date().toISOString();
      const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
      const feedItems = posts.map(p => `\n    <entry>\n      <id>tag:${siteUrl},${p.createdAt.getFullYear()}:${p.id}</id>\n      <title>${p.title || 'Untitled'}</title>\n      <link href="${siteUrl}/post/${p.slug}"/>\n      <updated>${(p.publishedAt||p.updatedAt).toISOString()}</updated>\n      <summary>${(p.excerpt||'').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c] as string)).slice(0,300)}</summary>\n    </entry>`).join('');
      atomCache = `<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n  <id>tag:${siteUrl},2025:feed</id>\n  <title>${title}</title>\n  <subtitle>${tagline}</subtitle>\n  <updated>${updated}</updated>\n  <link href="${siteUrl}/api/feed/atom" rel="self"/>\n  <link href="${siteUrl}"/>${feedItems}\n</feed>`;
      atomEtag = 'W/"'+crypto.createHash('sha1').update(atomCache).digest('hex')+'"';
      atomTime = now;
    }
    const inm = req.headers.get('if-none-match');
    if (inm && atomEtag && inm === atomEtag) return new NextResponse(null,{ status:304, headers:{ 'ETag': atomEtag } });
    return new NextResponse(atomCache,{ status:200, headers:{ 'Content-Type': 'application/atom+xml; charset=utf-8', 'Cache-Control':'public, max-age=300','ETag': atomEtag || '' } });
  } catch(e:any) {
    return new NextResponse('Feed error',{ status:500 });
  }
}
