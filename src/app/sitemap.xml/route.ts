import crypto from 'crypto';

import { NextResponse } from 'next/server';

import '@/src/lib/bootstrap';
import { sitemapService } from '@/src/modules/sitemap';

export const dynamic = 'force-dynamic';

let cachedXml: string | null = null;
let cachedEtag: string | null = null;
let cachedGenerated = 0;

export async function GET(req: Request) {
  try {
    const now = Date.now();
    if (!cachedXml || (now - cachedGenerated) > 10 * 60 * 1000) {
      cachedXml = await sitemapService.generateSitemap();
      cachedEtag = 'W/"'+crypto.createHash('sha1').update(cachedXml).digest('hex')+'"';
      cachedGenerated = now;
    }
    const inm = req.headers.get('if-none-match');
    if (inm && cachedEtag && inm === cachedEtag) {
      return new NextResponse(null, { status:304, headers:{ 'ETag': cachedEtag } });
    }
    return new NextResponse(cachedXml, { status: 200, headers: { 'Content-Type':'application/xml; charset=utf-8', 'Cache-Control':'public, max-age=600', 'ETag': cachedEtag || '' } });
  } catch (e:any) {
    return new NextResponse('sitemap error', { status: 500 });
  }
}
