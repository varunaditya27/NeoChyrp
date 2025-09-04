import crypto from 'crypto';

import { NextResponse } from 'next/server';

import '@/src/lib/bootstrap';
import { generateRssFeed } from '@/src/lib/feed/generator';

export const dynamic = 'force-dynamic';
let rssCache: string | null = null; let rssEtag: string | null = null; let rssTime = 0;
export async function GET(req: Request) {
	try {
		const now = Date.now();
		if (!rssCache || (now - rssTime) > 5 * 60 * 1000) {
			rssCache = await generateRssFeed();
			rssEtag = 'W/"'+crypto.createHash('sha1').update(rssCache).digest('hex')+'"';
			rssTime = now;
		}
		const inm = req.headers.get('if-none-match');
		if (inm && rssEtag && inm === rssEtag) return new NextResponse(null,{ status:304, headers:{ 'ETag': rssEtag } });
		return new NextResponse(rssCache,{ status:200, headers:{'Content-Type':'application/rss+xml; charset=utf-8','Cache-Control':'public, max-age=300','ETag': rssEtag || ''} });
	} catch {
		return new NextResponse('rss error',{status:500});
	}
}
