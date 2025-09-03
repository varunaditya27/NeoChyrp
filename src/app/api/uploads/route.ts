import { NextResponse } from 'next/server';

// Legacy placeholder: direct uploads deprecated in favor of /api/assets/upload
export async function GET() {
	return NextResponse.json({ error: 'Use /api/assets for listing.' }, { status: 410 });
}

export async function POST() {
	return NextResponse.json({ error: 'Use /api/assets/upload for uploads.' }, { status: 410 });
}
