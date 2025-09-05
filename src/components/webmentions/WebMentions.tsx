'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface WebMention {
  id: string;
  sourceUrl: string;
  type: 'mention' | 'like' | 'repost' | 'reply';
  author?: {
    name?: string;
    url?: string;
    photo?: string;
  };
  content?: string;
  publishedAt?: string;
  createdAt: string;
}

interface WebMentionsProps {
  postId: string;
  className?: string;
}

export default function WebMentions({ postId, className = '' }: WebMentionsProps) {
  const [webmentions, setWebmentions] = useState<WebMention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWebmentions();
  }, [postId]);

  const fetchWebmentions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/webmentions?postId=${postId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch webmentions');
      }

      const data = await response.json();
      setWebmentions(data.webmentions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const groupedMentions = webmentions.reduce((acc, mention) => {
    const type = mention.type || 'mention';
    if (!acc[type]) acc[type] = [];
    acc[type].push(mention);
    return acc;
  }, {} as Record<string, WebMention[]>);

  const renderAuthor = (author?: WebMention['author'], sourceUrl?: string) => {
    if (!author && !sourceUrl) return null;

    const name = author?.name || 'Someone';
    const url = author?.url || sourceUrl;
    const photo = author?.photo;

    return (
      <div className="flex items-center space-x-2">
        {photo && (
          <img
            src={photo}
            alt={name}
            className="w-8 h-8 rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <div>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              {name}
            </a>
          ) : (
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {name}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderMention = (mention: WebMention) => {
    const publishedDate = mention.publishedAt || mention.createdAt;
    const timeAgo = formatDistanceToNow(new Date(publishedDate), { addSuffix: true });

    return (
      <div
        key={mention.id}
        className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border"
      >
        <div className="flex items-start justify-between mb-2">
          {renderAuthor(mention.author, mention.sourceUrl)}
          <a
            href={mention.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
            title={`View original (${mention.sourceUrl})`}
          >
            {timeAgo}
          </a>
        </div>

        {mention.content && (
          <div className="mt-2 text-gray-700 dark:text-gray-300">
            <p className="line-clamp-4">{mention.content}</p>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {mention.type}
          </span>
        </div>
      </div>
    );
  };

  const renderTypeSection = (type: string, mentions: WebMention[]) => {
    const typeLabels: Record<string, string> = {
      like: '❤️ Likes',
      repost: '🔄 Reposts',
      reply: '💬 Replies',
      mention: '📝 Mentions',
    };

    const label = typeLabels[type] || `📝 ${type}s`;

    return (
      <div key={type} className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          {label}
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({mentions.length})
          </span>
        </h4>

        {type === 'like' || type === 'repost' ? (
          // Compact display for likes and reposts
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {mentions.map((mention) => (
              <div
                key={mention.id}
                className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
              >
                {renderAuthor(mention.author, mention.sourceUrl)}
              </div>
            ))}
          </div>
        ) : (
          // Full display for replies and mentions
          <div className="space-y-4">
            {mentions.map(renderMention)}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`webmentions ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`webmentions ${className}`}>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-400">
            Failed to load webmentions: {error}
          </p>
        </div>
      </div>
    );
  }

  if (webmentions.length === 0) {
    return (
      <div className={`webmentions ${className}`}>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No webmentions yet.</p>
          <p className="text-sm mt-1">
            Be the first to mention this post from your website!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`webmentions ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Webmentions
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {webmentions.length} response{webmentions.length !== 1 ? 's' : ''} from around the web
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedMentions)
          .sort(([a], [b]) => {
            // Order: replies, mentions, likes, reposts
            const order = ['reply', 'mention', 'like', 'repost'];
            return order.indexOf(a) - order.indexOf(b);
          })
          .map(([type, mentions]) => renderTypeSection(type, mentions))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-2">
            Have you written a response to this? Let me know the URL:
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-xs break-all">
            {typeof window !== 'undefined' && window.location.href}
          </div>
          <p className="mt-2">
            Learn more about{' '}
            <a
              href="https://indieweb.org/Webmention"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              webmentions
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
