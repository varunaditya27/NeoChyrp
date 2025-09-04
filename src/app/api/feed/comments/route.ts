import { NextResponse } from 'next/server';

import '@/src/lib/bootstrap';
import { generateCommentsFeed } from '@/src/lib/feed/generator';
export const dynamic='force-dynamic';
export async function GET() { try { const xml = await generateCommentsFeed(); return new NextResponse(xml,{ status:200, headers:{'Content-Type':'application/atom+xml; charset=utf-8','Cache-Control':'public, max-age=180'} }); } catch { return new NextResponse('comments feed error',{status:500}); } }
