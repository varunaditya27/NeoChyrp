import { randomUUID, randomBytes } from 'crypto';

import { NextResponse } from 'next/server';

import { getUserFromBearer } from '@/src/lib/auth/currentUser';
import { prisma } from '@/src/lib/db';
import { requirePermission } from '@/src/lib/permissions';
import { createSupabaseServiceClient, MEDIA_BUCKET, publicAssetUrl } from '@/src/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Auth + permission
  const user = await getUserFromBearer(req.headers.get('authorization'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try { await requirePermission(req as any, 'asset:upload'); } catch (e:any) { return NextResponse.json({ error: e.message }, { status: e.status || 403 }); }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  const originalName = (file.name || 'upload').replace(/[^A-Za-z0-9_.-]/g, '_');
  const ext = originalName.includes('.') ? originalName.split('.').pop() : 'bin';
  const id = randomUUID();
  const path = `${user.id}/${id}.${ext}`;
  const mimeType = file.type || 'application/octet-stream';
  const size = file.size;

  let supabase;
  try {
    supabase = createSupabaseServiceClient();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Attempt optional dimension extraction for images
  let width: number | null = null;
  let height: number | null = null;
  let thumbPath: string | null = null;
  if (mimeType.startsWith('image/')) {
    try {
      const sharp = (await import('sharp')).default;
      const meta = await sharp(buffer).metadata();
      width = meta.width || null;
      height = meta.height || null;
      // Generate a small webp thumbnail (fit inside 256x256)
      const thumb = await sharp(buffer).resize(256, 256, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 70 }).toBuffer();
      thumbPath = `${user.id}/thumb_${id}.webp`;
      const { error: thumbErr } = await supabase.storage.from(MEDIA_BUCKET).upload(thumbPath, thumb, {
        cacheControl: '3600',
        contentType: 'image/webp',
        upsert: true
      });
      if (thumbErr) thumbPath = null;
    } catch { /* ignore */ }
  }

  const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(path, buffer, {
    cacheControl: '3600',
    contentType: mimeType,
    upsert: false
  });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const type = mimeType.startsWith('image/') ? 'IMAGE' : mimeType.startsWith('video/') ? 'VIDEO' : mimeType.startsWith('audio/') ? 'AUDIO' : 'FILE';

  const url = publicAssetUrl(path);

  const accessToken = randomBytes(12).toString('base64url');
  const asset = await prisma.asset.create({
    data: {
      ownerId: user.id,
      type,
      mimeType,
      size: size,
      width: width || undefined,
      height: height || undefined,
      durationMs: undefined,
      checksum: null,
      storagePath: path,
      url,
  ...(thumbPath ? { /* new field */ thumbnailPath: thumbPath as any } : {}),
  ...(accessToken ? { /* new field */ accessToken: accessToken as any } : {})
    }
  });

  return NextResponse.json({ data: { ...asset, thumbnailUrl: thumbPath ? publicAssetUrl(thumbPath) : null } });
}
