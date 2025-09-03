/**
 * Root Layout (App Router):
 * - Defines global HTML shell, metadata, and providers (theme, auth, etc.).
 */
import '@/src/styles/globals.css';
import { Footer } from '@/src/components/layout/footer';
import { Header } from '@/src/components/layout/header';
import { AuthProvider } from '@/src/lib/auth/session';

import type { ReactNode } from 'react';

export const metadata = {
  title: 'NeoChyrp - Modern Blogging Platform',
  description: 'A modern, extensible blogging engine built with Next.js, TypeScript, and Prisma'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="flex h-full flex-col bg-gray-50">
        <AuthProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
