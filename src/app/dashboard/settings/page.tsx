import { revalidatePath } from 'next/cache';
import React from 'react';

import ThemePreviewToggle from '@/src/components/dashboard/ThemePreviewToggle';
import { Container } from '@/src/components/layout/Container';
import { settingsService } from '@/src/lib/settings/service';

import SettingsForm from './SettingsForm';
import SettingsFormStatusBridge from './SettingsFormStatusBridge';
import SettingsSuccessNotification from './SettingsSuccessNotification';

async function saveSettings(formData: FormData): Promise<void> {
  'use server';
  const siteTitle = String(formData.get('siteTitle') || 'NeoChyrp');
  const tagline = String(formData.get('tagline') || '');
  const description = String(formData.get('description') || '');
  const url = String(formData.get('url') || '');
  const contact = String(formData.get('contact') || '');
  const theme = String(formData.get('theme') || 'light');
  const postsPerPage = parseInt(String(formData.get('postsPerPage')||'10'),10) || 10;
  const defaultVisibility = String(formData.get('defaultVisibility') || 'PUBLISHED');
  await settingsService.updateSiteSettings({
    title: siteTitle,
    tagline,
    description,
    url,
    contact,
    theme,
    postsPerPage,
    defaultVisibility
  });

  // Comprehensive revalidation to ensure all pages reflect the changes
  revalidatePath('/', 'layout'); // Revalidate the root layout
  revalidatePath('/');
  revalidatePath('/api/settings/public');
  revalidatePath('/api/settings');
  revalidatePath('/blog');
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard');
  revalidatePath('/tags');
  revalidatePath('/categories');
}

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const { title, tagline, theme, postsPerPage, defaultVisibility, description, url, contact } = await settingsService.getSiteSettings();
  return (
    <div className="py-8">
      <Container>
        <h1 className="mb-6 text-2xl font-bold">Site Configuration</h1>
        <div className="mb-8">
          <p className="text-gray-600">
            Configure your site&apos;s basic settings. Changes will be applied immediately across your entire site.
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="mb-4 text-lg font-semibold">General Settings</h2>
            <SettingsForm
              title={title}
              tagline={tagline}
              description={description}
              url={url}
              contact={contact}
              theme={theme}
              postsPerPage={postsPerPage}
              defaultVisibility={defaultVisibility}
              action={saveSettings}
            />
          </div>

          <hr className="border-gray-200" />

          <div>
            <h2 className="mb-4 text-lg font-semibold">Theme Preview</h2>
            <ThemePreviewToggle />
          </div>
        </div>

        {/* Bridge triggers a settings refresh event after server action completes */}
        <SettingsFormStatusBridge />

        {/* Success notification */}
        <SettingsSuccessNotification />
      </Container>
    </div>
  );
}
