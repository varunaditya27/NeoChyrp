/**
 * Home Page
 * Modern landing page with integrated auth and better user experience
 */

"use client";

import Link from "next/link";
import React from "react";

import Features from "../components/Features";
import { useAuth } from "../lib/auth/session";
import { canAccessAdmin, canAccessAuthorDashboard, isRegularUser, canCreateContent } from "../lib/auth/adminAccess";

const HomePage: React.FC = () => {
  const { user, loading } = useAuth();

  const getDashboardLink = () => {
    if (!user) return "/";
    if (canAccessAdmin(user)) return "/admin";
    if (canAccessAuthorDashboard(user)) return "/author";
    if (isRegularUser(user)) return "/user";
    return "/";
  };

  const getDashboardLabel = () => {
    if (!user) return "Dashboard";
    if (canAccessAdmin(user)) return "Admin Dashboard";
    if (canAccessAuthorDashboard(user)) return "Author Dashboard";
    if (isRegularUser(user)) return "User Dashboard";
    return "Dashboard";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 size-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                NeoChyrp
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              A modern, extensible blogging platform built with Next.js, TypeScript, and Prisma.
              Create, share, and manage your content with ease.
            </p>

            {!user ? (
              <div className="mt-10">
                <p className="text-lg text-gray-600 mb-6">
                  Use the navigation bar above to sign in or create an account to get started.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Link
                    href="/blog"
                    className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
                  >
                    Browse Posts
                  </Link>
                  <Link
                    href="/tags"
                    className="rounded-md border border-gray-300 bg-white px-6 py-3 text-lg font-semibold text-gray-900 shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    Explore Topics
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-10">
                <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Welcome back, {user.displayName || user.username}!
                  </h2>
                  <p className="text-gray-600">Ready to create something amazing?</p>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Link
                    href={getDashboardLink()}
                    className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
                  >
                    {getDashboardLabel()}
                  </Link>
                  <Link
                    href="/blog"
                    className="rounded-md border border-gray-300 bg-white px-6 py-3 text-lg font-semibold text-gray-900 shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    View Blog
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Actions for Authenticated Users */}
      {user && (
        <section className="border-y bg-white/50 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
              <p className="text-gray-600">Jump straight into managing your content</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href={getDashboardLink()}
                className="group rounded-xl border border-gray-200 bg-white p-6 text-center transition-all duration-200 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <svg className="size-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{getDashboardLabel()}</h3>
                <p className="text-sm text-gray-500">Access your dashboard</p>
              </Link>

              {(canCreateContent(user) || canAccessAdmin(user)) && (
                <Link
                  href={canAccessAdmin(user) ? "/admin/write" : "/author/write"}
                  className="group rounded-xl border border-gray-200 bg-white p-6 text-center transition-all duration-200 hover:border-green-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                    <svg className="size-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">New Post</h3>
                  <p className="text-sm text-gray-500">Write something new</p>
                </Link>
              )}

              <Link
                href="/blog"
                className="group rounded-xl border border-gray-200 bg-white p-6 text-center transition-all duration-200 hover:border-purple-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
                  <svg className="size-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">View Blog</h3>
                <p className="text-sm text-gray-500">Browse all posts</p>
              </Link>

              {canAccessAdmin(user) && (
                <Link
                  href="/admin/settings"
                  className="group rounded-xl border border-gray-200 bg-white p-6 text-center transition-all duration-200 hover:border-orange-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-orange-100 group-hover:bg-orange-200 transition-colors">
                    <svg className="size-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">Settings</h3>
                  <p className="text-sm text-gray-500">Customize your site</p>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <Features />

      {/* Call to Action for Non-authenticated Users */}
      {!user && (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of creators who are already using NeoChyrp to share their stories with the world.
            </p>
            <p className="text-base text-gray-500">
              Use the "Sign Up" button in the navigation bar above to create your account and get started.
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
