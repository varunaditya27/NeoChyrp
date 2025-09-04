import { NextResponse } from 'next/server';

import '@/src/lib/bootstrap';
import { generateTagRss } from '@/src/lib/feed/generator';
export const dynamic='force-dynamic';
export async function GET(_req:Request,{ params }:{ params: Promise<{ slug:string }> }) { const { slug } = await params; try { const xml = await generateTagRss(slug); return new NextResponse(xml,{ status:200, headers:{'Content-Type':'application/rss+xml; charset=utf-8','Cache-Control':'public, max-age=300'} }); } catch { return new NextResponse('tag rss error',{status:500}); } }
