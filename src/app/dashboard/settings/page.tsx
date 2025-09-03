import { revalidatePath } from 'next/cache';

import { Container } from '@/src/components/layout/Container';
import { prisma } from '@/src/lib/db';

async function saveSettings(formData: FormData): Promise<void> {
  'use server';
  const siteTitle = String(formData.get('siteTitle') || 'My Blog');
  const tagline = String(formData.get('tagline') || '');
  await prisma.setting.upsert({
    where: { key: 'site:title' },
    update: { value: siteTitle },
    create: { key: 'site:title', value: siteTitle }
  });
  await prisma.setting.upsert({
    where: { key: 'site:tagline' },
    update: { value: tagline },
    create: { key: 'site:tagline', value: tagline }
  });
  revalidatePath('/');
}

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const title = await prisma.setting.findUnique({ where: { key: 'site:title' } });
  const tagline = await prisma.setting.findUnique({ where: { key: 'site:tagline' } });
  return (
    <div className="py-8">
      <Container>
        <h1 className="mb-6 text-2xl font-bold">Settings</h1>
        <form action={saveSettings} className="max-w-lg space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Site Title</label>
            <input name="siteTitle" defaultValue={title?.value as string || ''} className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tagline</label>
            <input name="tagline" defaultValue={tagline?.value as string || ''} className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save</button>
          <p className="text-xs text-gray-500">(Basic placeholder settings; extend later.)</p>
        </form>
      </Container>
    </div>
  );
}
