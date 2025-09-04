import { revalidatePath } from 'next/cache';
import React from 'react';

import ThemePreviewToggle from '@/src/components/dashboard/ThemePreviewToggle';
import { Container } from '@/src/components/layout/Container';
import { settingsService } from '@/src/lib/settings/service';

import SettingsFormStatusBridge from './SettingsFormStatusBridge';

async function saveSettings(formData: FormData): Promise<void> {
  'use server';
  const siteTitle = String(formData.get('siteTitle') || 'NeoChyrp');
  const tagline = String(formData.get('tagline') || '');
  const theme = String(formData.get('theme') || 'light');
  const postsPerPage = parseInt(String(formData.get('postsPerPage')||'10'),10) || 10;
  const defaultVisibility = String(formData.get('defaultVisibility') || 'PUBLISHED');
  await settingsService.updateSiteSettings({ title: siteTitle, tagline, theme, postsPerPage, defaultVisibility });
  revalidatePath('/');
  revalidatePath('/api/settings/public');
  revalidatePath('/blog');
  revalidatePath('/dashboard/settings');
}

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const { title, tagline, theme, postsPerPage, defaultVisibility } = await settingsService.getSiteSettings();
  return (
    <div className="py-8">
      <Container>
        <h1 className="mb-6 text-2xl font-bold">Settings</h1>
  {/* Server Action form: method defaults to POST; explicit method attribute causes a React warning in Next.js 15 */}
  <form action={saveSettings} className="max-w-lg space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Site Title</label>
            <input name="siteTitle" defaultValue={title || ''} className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tagline</label>
            <input name="tagline" defaultValue={tagline || ''} className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Theme</label>
              <select name="theme" defaultValue={theme} className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Posts per Page</label>
              <input type="number" min={1} max={100} name="postsPerPage" defaultValue={postsPerPage} className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Default Post Visibility</label>
            <select name="defaultVisibility" defaultValue={defaultVisibility} className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="PRIVATE">Private</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <button type="submit" className="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700">Save</button>
            <span className="text-xs text-gray-500">Last updated applies immediately across site.</span>
          </div>
        </form>
        <div className="mt-10">
          <ThemePreviewToggle />
        </div>
  {/* Bridge triggers a settings refresh event after server action completes */}
  <SettingsFormStatusBridge />
      </Container>
    </div>
  );
}
