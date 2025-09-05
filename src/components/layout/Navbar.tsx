/**
 * Navbar Component
 * Enhanced navigation component with dynamic menu items and responsive design
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

import { useAuth } from "@/src/lib/auth/session";
import { useSiteSettings } from '@/src/lib/settings/useSiteSettings';
import { canAccessAdmin, canAccessAuthorDashboard, isRegularUser } from "@/src/lib/auth/adminAccess";
import AuthModal from "../AuthModal";

interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
  authorOnly?: boolean;
  userOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/tags", label: "Tags" },
  { href: "/categories", label: "Categories" },
  { href: "/admin", label: "Admin", adminOnly: true },
  { href: "/author", label: "Dashboard", authorOnly: true },
  { href: "/user", label: "Dashboard", userOnly: true },
];

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const { title } = useSiteSettings();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const handleAuthClick = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly) {
      return canAccessAdmin(user); // Only show admin items if user is admin
    }
    if (item.authorOnly) {
      return canAccessAuthorDashboard(user) && !canAccessAdmin(user); // Only show author dashboard if not admin
    }
    if (item.userOnly) {
      return isRegularUser(user); // Only show user dashboard for regular users
    }
    return true;
  });

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
              N
            </div>
            <span className="text-xl font-bold text-gray-900">{title}</span>
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              alpha
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive(item.href)
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:border-b-2 hover:border-gray-300 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Auth Status */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
            ) : user ? (
              <div className="flex items-center space-x-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  {(user.displayName || user.username || user.email)?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="text-sm text-gray-700">
                  {user.displayName || user.username || user.email}
                </span>
                <button
                  onClick={logout}
                  className="ml-4 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleAuthClick("login")}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Login
                </button>
                <button
                  onClick={() => handleAuthClick("register")}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="block size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              ) : (
                <svg className="block size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? "border-r-4 border-blue-600 bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* Mobile Auth */}
              <div className="border-t border-gray-200 pt-4">
                {loading ? (
                  <div className="px-3 py-2">
                    <div className="h-8 w-full animate-pulse rounded bg-gray-200" />
                  </div>
                ) : user ? (
                  <div className="px-3 py-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                        {(user.displayName || user.username || user.email)?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <span className="text-sm text-gray-700">
                        {user.displayName || user.username || user.email}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="mt-2 block text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1 px-3 py-2">
                    <button
                      onClick={() => handleAuthClick("login")}
                      className="block text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => handleAuthClick("register")}
                      className="block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
      />
    </nav>
  );
}
