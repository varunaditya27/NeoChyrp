/**
 * Root Layout (App Router):
 * - Defines global HTML shell, metadata, and providers (theme, auth, etc.).
 */
import '@/src/styles/globals.css';
import { Footer } from '@/src/components/layout/footer';
import { Header } from '@/src/components/layout/header';
import ThemeClient from '@/src/components/ThemeClient';
import { AuthProvider } from '@/src/lib/auth/session';
import { settingsService } from '@/src/lib/settings/service';

import type { ReactNode } from 'react';

export async function generateMetadata() {
  const { title, tagline } = await settingsService.getSiteSettings();
  return {
    title: `${title}${tagline ? ' – ' + tagline : ''}`,
    description: 'A modern, extensible blogging engine built with Next.js, TypeScript, and Prisma'
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { theme } = await settingsService.getSiteSettings();
  // Parse URL via headers (Next 15: not directly available here; fallback to theme only)
  // Simple preview override using environment variable or future middleware injection
  const previewTheme = process.env.NEOCHYRP_PREVIEW_THEME;
  const effective = previewTheme || theme;
  const initialTheme = effective === 'auto' ? 'light' : effective; // server-side best guess
  return (
  <html lang="en" className="h-full" data-theme={initialTheme} data-theme-preview={previewTheme ? '1':'0'}>
      <body className="flex h-full flex-col bg-gray-50">
        <AuthProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
        <ThemeClient />
        <noscript><style>{`:root[data-theme='dark'] { color-scheme: dark; }`}</style></noscript>
      </body>
    </html>
  );
}
