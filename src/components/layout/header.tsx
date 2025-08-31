/**
 * Site Header:
 * - Global navigation shell.
 * - Will display dynamic login/profile, search, theme switch, etc.
 */
import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-brand">NeoChyrp</Link>
        <nav className="flex gap-6 text-sm">
          <Link href="/blog">Blog</Link>
          <Link href="/tags">Tags</Link>
          <Link href="/categories">Categories</Link>
          <Link href="/dashboard" className="font-medium">Dashboard</Link>
        </nav>
      </div>
    </header>
  );
}
