'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface WebMention {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  type?: string;
  post?: {
    title: string;
    slug: string;
  };
  createdAt: string;
}

interface WebMentionStats {
  total: number;
  byType: Record<string, number>;
  recent: WebMention[];
}

export default function WebMentionsPage() {
  const [stats, setStats] = useState<WebMentionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/webmentions?stats=true');
      if (!response.ok) {
        throw new Error('Failed to fetch webmention stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-red-800 dark:text-red-400 font-medium">Error</h3>
          <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          WebMentions
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage incoming and outgoing webmentions for your site.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">📝</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.total || 0}
              </p>
              <p className="text-gray-600 dark:text-gray-400">Total WebMentions</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">❤️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.byType.like || 0}
              </p>
              <p className="text-gray-600 dark:text-gray-400">Likes</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">💬</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.byType.reply || 0}
              </p>
              <p className="text-gray-600 dark:text-gray-400">Replies</p>
            </div>
          </div>
        </div>
      </div>

      {/* Type Breakdown */}
      {stats?.byType && Object.keys(stats.byType).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            By Type
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {count}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {type}s
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent WebMentions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Recent WebMentions
          </h2>
        </div>

        {stats?.recent && stats.recent.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {stats.recent.map((mention) => (
              <div key={mention.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {mention.type || 'mention'}
                      </span>
                      {mention.post && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          on &ldquo;{mention.post.title}&rdquo;
                        </span>
                      )}
                    </div>

                    <div className="mb-2">
                      <a
                        href={mention.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
                      >
                        {mention.sourceUrl}
                      </a>
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(mention.createdAt), { addSuffix: true })}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <a
                      href={mention.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="View target"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <p>No webmentions yet.</p>
            <p className="text-sm mt-1">
              WebMentions will appear here when other sites mention your posts.
            </p>
          </div>
        )}
      </div>

      {/* WebMention Endpoint Info */}
      <div className="mt-8 bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          WebMention Endpoint
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Your webmention endpoint is automatically advertised in your site's HTML.
        </p>
        <div className="bg-white dark:bg-gray-800 rounded border p-3 font-mono text-sm">
          {typeof window !== 'undefined'
            ? `${window.location.origin}/api/webmentions`
            : '/api/webmentions'
          }
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Other sites can send webmentions to this endpoint when they mention your posts.
        </p>
      </div>
    </div>
  );
}
