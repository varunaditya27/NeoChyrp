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
  title: 'NeoChyrp',
  description: 'Modern remake of the Chyrp blogging engine'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <AuthProvider>
          <Header />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
