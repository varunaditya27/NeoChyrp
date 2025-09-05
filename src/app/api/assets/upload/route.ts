import { randomUUID, randomBytes } from 'crypto';

import { verify } from 'jsonwebtoken';
import { NextResponse } from 'next/server';

import { getUserFromBearer } from '@/src/lib/auth/currentUser';
import { prisma } from '@/src/lib/db';
import { userHas } from '@/src/lib/permissions';
import { createSupabaseServiceClient, MEDIA_BUCKET, publicAssetUrl } from '@/src/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
  const MAX_FILE_BYTES = parseInt(process.env.MAX_UPLOAD_BYTES || process.env.NEXT_PUBLIC_MAX_UPLOAD_BYTES || '1048576', 10); // default 1MB
    // Auth + permission
    let user = await getUserFromBearer(req.headers.get('authorization'));
    if (!user) {
      const cookieHeader = (req as any).headers.get('cookie') || '';
      const tokenMatch = cookieHeader.match(/(?:^|; )auth-token=([^;]+)/);
      if (tokenMatch) {
        try {
          const raw = decodeURIComponent(tokenMatch[1]);
          const secret = process.env.JWT_SECRET || 'your-secret-key';
          const decoded: any = verify(raw, secret);
          user = await prisma.user.findUnique({ where: { id: decoded.userId } }) as any;
        } catch { /* ignore */ }
      }
    }
    if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'AUTH' }, { status: 401 });
    if (!userHas(user.role, 'asset:upload')) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

      const form = await req.formData();
      const file = form.get('file');
      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'Missing file', code: 'NO_FILE' }, { status: 400 });
      }

      const originalName = (file.name || 'upload').replace(/[^A-Za-z0-9_.-]/g, '_');
      const ext = originalName.includes('.') ? originalName.split('.').pop() : 'bin';
  const id = randomUUID();
  const storagePath = `${user.id}/${id}.${ext}`;
      const mimeType = file.type || 'application/octet-stream';
      const size = file.size;
      if (size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: `File too large. Max ${(MAX_FILE_BYTES/1024/1024).toFixed(2)} MB`, code: 'FILE_TOO_LARGE', maxBytes: MAX_FILE_BYTES }, { status: 413 });
      }

      let supabase;
      try {
        supabase = createSupabaseServiceClient();
      } catch (e) {
        return NextResponse.json({ error: (e as Error).message, code: 'SUPABASE_CONFIG' }, { status: 500 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Optional dimension extraction for images
      let width: number | null = null;
      let height: number | null = null;
      let thumbPath: string | null = null;
      if (mimeType.startsWith('image/')) {
        try {
          const sharp = (await import('sharp')).default;
          const meta = await sharp(buffer).metadata();
          width = meta.width || null;
          height = meta.height || null;
          const thumb = await sharp(buffer).resize(256, 256, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 70 }).toBuffer();
          thumbPath = `${user.id}/thumb_${id}.webp`;
          const { error: thumbErr } = await supabase.storage.from(MEDIA_BUCKET).upload(thumbPath, thumb, {
            cacheControl: '3600',
            contentType: 'image/webp',
            upsert: true
          });
          if (thumbErr) thumbPath = null;
        } catch { /* ignore image meta errors */ }
      }
      const attemptUpload = async () => {
        return supabase.storage.from(MEDIA_BUCKET).upload(storagePath, buffer, {
          cacheControl: '3600',
          contentType: mimeType,
          upsert: false
        });
      };

      let { error: uploadError } = await attemptUpload();
    if (uploadError && /bucket.*not.*found|does not exist/i.test(uploadError.message)) {
        // Try to create bucket automatically then retry once
        try {
          await (supabase as any).storage.createBucket(MEDIA_BUCKET, {
            public: true,
            allowedMimeTypes: ['image/*', 'video/*', 'audio/*', 'application/*'],
            fileSizeLimit: MAX_FILE_BYTES
          });
          const retry = await attemptUpload();
          uploadError = retry.error;
        } catch (e) {
          // swallow, will return original error below
        }
      }
      if (uploadError) {
        const correlationId = randomUUID();
        console.error('STORAGE_UPLOAD_FAIL', { correlationId, message: uploadError.message });
        return NextResponse.json({ error: uploadError.message, code: 'STORAGE_UPLOAD', correlationId }, { status: 500 });
      }

    const type = mimeType.startsWith('image/') ? 'IMAGE' : mimeType.startsWith('video/') ? 'VIDEO' : mimeType.startsWith('audio/') ? 'AUDIO' : 'FILE';
    const url = publicAssetUrl(storagePath);
    const thumbPublic = thumbPath ? publicAssetUrl(thumbPath) : null;
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
      storagePath: storagePath,
          url,
          ...(thumbPath ? { thumbnailPath: thumbPath as any } : {}),
          ...(accessToken ? { accessToken: accessToken as any } : {})
        }
      });

  return NextResponse.json({ data: { ...asset, thumbnailUrl: thumbPublic } });
  } catch (err: any) {
    const correlationId = randomUUID();
    console.error('ASSET_UPLOAD_UNCAUGHT', { correlationId, err });
    const message = err?.message || 'Internal error';
    return NextResponse.json({ error: message, code: 'UNCAUGHT', correlationId }, { status: err?.status || 500 });
  }
}
