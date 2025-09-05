// Ensure all feather definitions are registered before responding
import '@/src/feathers/text';
import '@/src/feathers/photo';
import '@/src/feathers/quote';
import '@/src/feathers/link';
import '@/src/feathers/video';
import '@/src/feathers/audio';
import '@/src/feathers/uploader';

import { NextResponse } from 'next/server';
import { featherRegistry } from '@/src/lib/feathers/registry';

export async function GET() {
  const feathers = Array.from(featherRegistry.listFeathers().values()).map(f => ({
    slug: f.manifest.slug,
    name: f.manifest.name,
    version: f.manifest.version,
    description: f.manifest.description,
    fields: f.manifest.fields
  }));
  return NextResponse.json({ success: true, feathers });
}
