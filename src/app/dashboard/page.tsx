/**
 * Admin Dashboard
 * Real dashboard with actual data and functionality
 */

import Link from 'next/link';
import { Suspense } from 'react';

import { Container } from '@/src/components/layout/Container';
import { prisma } from '@/src/lib/db';

// Loading component
function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200"></div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200"></div>
        ))}
      </div>
    </div>
  );
}

// Stats Component
async function DashboardStats() {
  try {
    const [
      postsCount,
      draftPostsCount,
      commentsCount,
      pendingCommentsCount,
      tagsCount,
      categoriesCount,
      usersCount,
      webmentionsCount,
    ] = await Promise.all([
      prisma.post.count({ where: { visibility: 'PUBLISHED' } }),
      prisma.post.count({ where: { visibility: 'DRAFT' } }),
      prisma.comment.count({ where: { status: 'APPROVED' } }),
      prisma.comment.count({ where: { status: 'PENDING' } }),
      prisma.tag.count(),
      prisma.category.count(),
      prisma.user.count(),
      prisma.webMention.count(),
    ]);

    const stats = [
      {
        name: 'Published Posts',
        value: postsCount,
        icon: 'document',
        color: 'blue',
        href: '/dashboard/posts',
        description: `${draftPostsCount} drafts`,
      },
      {
        name: 'Comments',
        value: commentsCount,
        icon: 'chat',
        color: 'green',
        href: '/dashboard/comments',
        description: `${pendingCommentsCount} pending`,
      },
      {
        name: 'Tags',
        value: tagsCount,
        icon: 'tag',
        color: 'purple',
        href: '/dashboard/tags',
        description: 'Manage tags',
      },
      {
        name: 'Categories',
        value: categoriesCount,
        icon: 'folder',
        color: 'yellow',
        href: '/dashboard/categories',
        description: 'Organize content',
      },
      {
        name: 'Users',
        value: usersCount,
        icon: 'users',
        color: 'indigo',
        href: '/dashboard/users',
        description: 'User management',
      },
      {
        name: 'WebMentions',
        value: webmentionsCount,
        icon: 'link',
        color: 'orange',
        href: '/dashboard/webmentions',
        description: 'Incoming webmentions',
      },
      {
        name: 'Settings',
        value: '⚙️',
        icon: 'cog',
        color: 'gray',
        href: '/dashboard/settings',
        description: 'Site configuration',
      },
    ];

    const getIcon = (iconName: string) => {
      const icons = {
        document: (
          <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        chat: (
          <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
        tag: (
          <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
          </svg>
        ),
        folder: (
          <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        ),
        users: (
          <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        ),
        cog: (
          <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        link: (
          <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        ),
      };
      return icons[iconName as keyof typeof icons] || icons.cog;
    };

    const getColorClasses = (color: string) => {
      const colors = {
        blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
        green: 'bg-green-50 text-green-600 hover:bg-green-100',
        purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
        yellow: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100',
        indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
        gray: 'bg-gray-50 text-gray-600 hover:bg-gray-100',
        orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
      };
      return colors[color as keyof typeof colors] || colors.gray;
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome to NeoChyrp admin panel. Manage your content and settings here.
            </p>
          </div>
          <Link
            href="/dashboard/posts/new"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <svg className="mr-2 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Post
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Link
              key={stat.name}
              href={stat.href}
              className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex items-center">
                <div className={`rounded-md p-3 ${getColorClasses(stat.color)}`}>
                  {getIcon(stat.icon)}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <p className="text-sm text-gray-500">{stat.description}</p>
                </div>
              </div>
              <div className="absolute right-4 top-4 text-gray-400 group-hover:text-gray-500">
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/dashboard/posts/new"
                className="flex items-center space-x-3 rounded-lg border border-dashed border-gray-300 p-4 text-center hover:border-gray-400"
              >
                <div className="rounded-full bg-blue-100 p-2">
                  <svg className="size-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Create Post</span>
              </Link>

              <Link
                href="/dashboard/pages/new"
                className="flex items-center space-x-3 rounded-lg border border-dashed border-gray-300 p-4 text-center hover:border-gray-400"
              >
                <div className="rounded-full bg-green-100 p-2">
                  <svg className="size-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">New Page</span>
              </Link>

              <Link
                href="/dashboard/categories/new"
                className="flex items-center space-x-3 rounded-lg border border-dashed border-gray-300 p-4 text-center hover:border-gray-400"
              >
                <div className="rounded-full bg-yellow-100 p-2">
                  <svg className="size-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Add Category</span>
              </Link>

              <Link
                href="/dashboard/settings"
                className="flex items-center space-x-3 rounded-lg border border-dashed border-gray-300 p-4 text-center hover:border-gray-400"
              >
                <div className="rounded-full bg-gray-100 p-2">
                  <svg className="size-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Settings</span>
              </Link>
              <Link
                href="/dashboard/assets"
                className="flex items-center space-x-3 rounded-lg border border-dashed border-gray-300 p-4 text-center hover:border-gray-400"
              >
                <div className="rounded-full bg-indigo-100 p-2">
                  <svg className="size-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4 4 4-4M12 4v12" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Upload Media</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <p className="py-8 text-center text-sm text-gray-500">
              Activity tracking coming soon...
            </p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    return (
      <div className="py-12 text-center">
        <h3 className="mt-4 text-lg font-medium text-gray-900">Unable to load dashboard</h3>
        <p className="mt-2 text-sm text-gray-500">
          There was an error loading the dashboard data. Please try again later.
        </p>
      </div>
    );
  }
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <Suspense fallback={<DashboardLoading />}>
          <DashboardStats />
        </Suspense>
      </Container>
    </div>
  );
}
