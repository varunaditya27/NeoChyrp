import { NextResponse } from 'next/server';
import { featherRegistry } from '@/src/lib/feathers/registry';
import '@/src/lib/feathers/post-renderer'; // side-effect: registers all feathers

export async function GET() {
  try {
    const feathers = Array.from(featherRegistry.listFeathers().values()).map(f => ({
      slug: f.manifest.slug,
      name: f.manifest.name,
      version: f.manifest.version,
      description: f.manifest.description,
      fields: (f.manifest.fields || []).map(field => ({
        name: field.name,
        type: field.type,
        label: field.label,
        required: !!field.required,
        placeholder: field.placeholder,
        multiple: field.multiple,
        options: field.options,
      })),
    }));
    return NextResponse.json({ success: true, feathers });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed to load feathers' }, { status: 500 });
  }
}
