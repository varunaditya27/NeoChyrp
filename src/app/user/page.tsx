/**
 * User Dashboard Page
 * Basic dashboard for regular users
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { getUserAccessLevel } from "@/src/lib/auth/adminAccess";
import { useAuth } from "@/src/lib/auth/session";

interface UserStats {
  commentsCount: number;
  likesGiven: number;
  joinedDate: string;
  profileCompleteness: number;
}

const UserDashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      fetchStats();
    }
  }, [user, loading, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || !user) {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  User Dashboard
                </h3>
                <div className="mt-1 text-sm text-green-700">
                  Welcome, <span className="font-semibold">{user.displayName || user.username}</span>!
                  <div className="text-xs">Access Level: {getUserAccessLevel(user)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/profile"
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">Edit Profile</h3>
              <p className="text-gray-600">Update your personal information</p>
            </Link>

            <Link
              href="/blog"
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">Browse Posts</h3>
              <p className="text-gray-600">Read and comment on blog posts</p>
            </Link>

            <Link
              href="/settings"
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">Account Settings</h3>
              <p className="text-gray-600">Manage your account preferences</p>
            </Link>
          </div>
        </div>

        {/* User Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Activity</h2>
          {loadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Comments Made</h3>
                <p className="text-2xl font-bold text-blue-600">{stats.commentsCount}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Likes Given</h3>
                <p className="text-2xl font-bold text-red-600">{stats.likesGiven}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">User Since</h3>
                <p className="text-sm font-bold text-gray-900">
                  {new Date(stats.joinedDate).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Profile Complete</h3>
                <p className="text-2xl font-bold text-green-600">{stats.profileCompleteness}%</p>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-gray-600">Unable to load stats. Please try again later.</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <p className="text-gray-600 text-center">Your recent activity will be displayed here.</p>
            </div>
          </div>
        </div>

        {/* Upgrade Notice for Regular Users */}
        <div className="mt-8">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Want to Create Content?
                </h3>
                <div className="mt-1 text-sm text-blue-700">
                  Contact the site administrator to request author privileges and start creating your own blog posts.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
