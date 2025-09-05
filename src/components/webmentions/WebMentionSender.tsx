'use client';

import React, { useState } from 'react';

interface WebMentionSenderProps {
  /** The target URL that was mentioned */
  targetUrl?: string;
  className?: string;
}

/**
 * WebMentionSender allows users to manually send webmentions
 * from their own sites to the current post.
 */
export default function WebMentionSender({ targetUrl, className = '' }: WebMentionSenderProps) {
  const [sourceUrl, setSourceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentUrl = targetUrl || (typeof window !== 'undefined' ? window.location.href : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sourceUrl.trim()) {
      setMessage({ type: 'error', text: 'Please enter a source URL' });
      return;
    }

    // Basic URL validation
    try {
      new URL(sourceUrl);
    } catch {
      setMessage({ type: 'error', text: 'Please enter a valid URL' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/webmentions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: sourceUrl,
          target: currentUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Webmention sent successfully! It will be verified and displayed shortly.'
        });
        setSourceUrl('');
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to send webmention'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Network error. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`webmention-sender ${className}`}>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Send a Webmention
        </h4>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Have you written a response to this post on your own website?
          Send me a webmention by submitting the URL of your post below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="source-url"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              URL of your response
            </label>
            <input
              id="source-url"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://your-site.com/your-response"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400"
              disabled={loading}
              required
            />
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p className="mb-1">Target URL: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{currentUrl}</code></p>
            <p>
              Make sure your response includes a link to this post for the webmention to be verified.
            </p>
          </div>

          {message && (
            <div className={`p-3 rounded-md text-sm ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !sourceUrl.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700
                       focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed
                       dark:focus:ring-offset-gray-800"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              'Send Webmention'
            )}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            New to webmentions?{' '}
            <a
              href="https://indieweb.org/Webmention"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              Learn more about webmentions
            </a>{' '}
            and how they work.
          </p>
        </div>
      </div>
    </div>
  );
}
