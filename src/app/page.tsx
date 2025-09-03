/**
 * Home Page
 * Landing page with hero section, featured content, and call-to-actions
 */

"use client";

import Link from "next/link";
import React, { useState } from "react";

import AuthModal from "../components/AuthModal";
import Features from "../components/Features";
import Hero from "../components/Hero";
import { useAuth } from "../lib/auth/session";

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const handleAuthClick = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero onAuthClick={handleAuthClick} />

      {/* Quick Navigation for Authenticated Users */}
      {user && (
        <section className="border-b bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
              <p className="text-gray-600">Quick access to your content management tools</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/dashboard"
                className="group rounded-lg border border-gray-200 bg-white p-6 text-center transition-all duration-200 hover:border-blue-300 hover:shadow-md"
              >
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200">
                  <svg className="size-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">Dashboard</h3>
                <p className="text-sm text-gray-500">Manage your content</p>
              </Link>

              <Link
                href="/blog"
                className="group rounded-lg border border-gray-200 bg-white p-6 text-center transition-all duration-200 hover:border-green-300 hover:shadow-md"
              >
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-green-100 group-hover:bg-green-200">
                  <svg className="size-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">View Blog</h3>
                <p className="text-sm text-gray-500">See your published posts</p>
              </Link>

              <Link
                href="/tags"
                className="group rounded-lg border border-gray-200 bg-white p-6 text-center transition-all duration-200 hover:border-purple-300 hover:shadow-md"
              >
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-purple-100 group-hover:bg-purple-200">
                  <svg className="size-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600">Browse Tags</h3>
                <p className="text-sm text-gray-500">Explore by topics</p>
              </Link>

              <Link
                href="/categories"
                className="group rounded-lg border border-gray-200 bg-white p-6 text-center transition-all duration-200 hover:border-yellow-300 hover:shadow-md"
              >
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-yellow-100 group-hover:bg-yellow-200">
                  <svg className="size-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-yellow-600">Categories</h3>
                <p className="text-sm text-gray-500">Organized content</p>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <Features />

      {/* Call to Action for Non-Authenticated Users */}
      {!user && (
        <section className="bg-blue-600">
          <div className="mx-auto max-w-6xl px-4 py-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">Ready to start blogging?</h2>
            <p className="mb-8 text-xl text-blue-100">
              Join NeoChyrp and create your modern blog with powerful features and a clean interface.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <button
                onClick={() => handleAuthClick("register")}
                className="rounded-md bg-white px-8 py-3 text-lg font-semibold text-blue-600 transition-colors duration-200 hover:bg-gray-50"
              >
                Get Started Free
              </button>
              <button
                onClick={() => handleAuthClick("login")}
                className="rounded-md border-2 border-white px-8 py-3 text-lg font-semibold text-white transition-colors duration-200 hover:bg-white hover:text-blue-600"
              >
                Sign In
              </button>
            </div>
          </div>
        </section>
      )}

      <AuthModal open={authOpen} mode={authMode} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default HomePage;
