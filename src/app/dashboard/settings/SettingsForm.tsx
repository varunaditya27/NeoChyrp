"use client";

import React from 'react';
import { useFormStatus } from 'react-dom';

interface SettingsFormProps {
  title: string;
  tagline: string;
  theme: string;
  postsPerPage: number;
  defaultVisibility: string;
  description: string;
  url: string;
  contact: string;
  action: (formData: FormData) => Promise<void>;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <div className="flex items-center gap-4">
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
      >
        {pending && (
          <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {pending ? 'Saving...' : 'Save Settings'}
      </button>
      {pending ? (
        <span className="text-xs text-blue-600">Updating site configuration...</span>
      ) : (
        <span className="text-xs text-gray-500">Changes apply immediately across the entire site.</span>
      )}
    </div>
  );
}

export default function SettingsForm({ title, tagline, theme, postsPerPage, defaultVisibility, description, url, contact, action }: SettingsFormProps) {
  return (
    <form action={action} className="max-w-lg space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Site Title</label>
        <input
          name="siteTitle"
          defaultValue={title || ''}
          className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter your site title"
          required
        />
        <p className="mt-1 text-xs text-gray-500">This will appear in the navigation bar and browser title.</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Tagline</label>
        <input
          name="tagline"
          defaultValue={tagline || ''}
          className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          placeholder="A short description of your site"
        />
        <p className="mt-1 text-xs text-gray-500">Optional tagline that appears alongside your site title.</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Site Description</label>
        <textarea
          name="description"
          defaultValue={description || ''}
          className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          rows={3}
          placeholder="Brief description of your site for SEO and feeds"
        />
        <p className="mt-1 text-xs text-gray-500">Used for meta descriptions, RSS feeds, and social media sharing.</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Site URL</label>
        <input
          type="url"
          name="url"
          defaultValue={url || ''}
          className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          placeholder="https://your-site.com"
        />
        <p className="mt-1 text-xs text-gray-500">The primary URL of your site (used for canonical links and feeds).</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Contact Email</label>
        <input
          type="email"
          name="contact"
          defaultValue={contact || ''}
          className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          placeholder="contact@your-site.com"
        />
        <p className="mt-1 text-xs text-gray-500">Optional contact email for general inquiries.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Theme</label>
          <select
            name="theme"
            defaultValue={theme}
            className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto (System)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">Controls the default appearance of your site.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Posts per Page</label>
          <input
            type="number"
            min={1}
            max={100}
            name="postsPerPage"
            defaultValue={postsPerPage}
            className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">Number of posts to display on blog pages.</p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Default Post Visibility</label>
        <select
          name="defaultVisibility"
          defaultValue={defaultVisibility}
          className="w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="PRIVATE">Private</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">Default visibility for new posts.</p>
      </div>

      <SubmitButton />
    </form>
  );
}
