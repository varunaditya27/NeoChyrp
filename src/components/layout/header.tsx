"use client";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

import { useAuth } from "@/src/lib/auth/session";

// Unified Header (formerly Navbar + Header)
// - Displays site navigation
// - Shows user avatar & menu only after authentication (no login/register buttons here)

const Header: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [open]);

  const display = user?.email || user?.user_metadata?.full_name || user?.id || "";
  const avatarLetter = display.charAt(0).toUpperCase();

  return (
    <header className="w-full border-b bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-8 px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-semibold text-brand">NeoChyrp</Link>
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">alpha</span>
        </div>
        <nav className="ml-auto hidden gap-6 text-sm md:flex">
          <Link href="/blog" className="text-gray-600 hover:text-gray-900">Blog</Link>
          <Link href="/tags" className="text-gray-600 hover:text-gray-900">Tags</Link>
          <Link href="/categories" className="text-gray-600 hover:text-gray-900">Categories</Link>
          <Link href="/dashboard" className="font-medium text-gray-700 hover:text-gray-900">Dashboard</Link>
        </nav>
        <div className="relative flex items-center gap-4" ref={menuRef}>
          {loading && (
            <div className="h-8 w-24 animate-pulse rounded bg-gray-200" aria-label="Loading session" />
          )}
          {/* No auth action buttons when signed out (handled elsewhere, e.g., Hero section) */}
          {!loading && user && (
            <>
              <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-haspopup="menu"
                aria-expanded={open}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  {avatarLetter}
                </span>
                <span className="hidden max-w-[150px] truncate md:inline-block">{display}</span>
                <svg className="size-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                </svg>
              </button>
              {open && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border border-gray-200 bg-white py-2 shadow-lg"
                >
                  <div className="px-4 pb-2 pt-1 text-xs uppercase tracking-wide text-gray-500">Account</div>
                  <button
                    type="button"
                    onClick={() => { setOpen(false); }}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                    role="menuitem"
                  >
                    Profile (soon)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOpen(false); signOut(); }}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    role="menuitem"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export { Header };
export default Header;
