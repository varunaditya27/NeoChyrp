"use client";

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';

type Tag = { id: string; name: string; slug: string; postCount?: number };

// Highlight matching parts of text with a simple fuzzy (subsequence) fallback
function highlightFuzzy(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;

  const tl = text;
  const tlc = text.toLowerCase();
  const qlc = q.toLowerCase();

  // Prefer contiguous substring highlight when available
  const idx = tlc.indexOf(qlc);
  if (idx !== -1) {
    return (
      <>
        {tl.slice(0, idx)}
        <mark className="bg-yellow-200 text-inherit px-0.5 rounded-sm">{tl.slice(idx, idx + q.length)}</mark>
        {tl.slice(idx + q.length)}
      </>
    );
  }

  // Fuzzy subsequence highlight
  let qi = 0;
  const parts: Array<{ text: string; mark: boolean }> = [];
  let buffer = '';
  for (let i = 0; i < tl.length; i++) {
    const ch = tl.charAt(i);
    if (qi < qlc.length && ch.toLowerCase() === qlc.charAt(qi)) {
      // flush buffer as normal text
      if (buffer) {
        parts.push({ text: buffer, mark: false });
        buffer = '';
      }
      // collect this matched char as marked segment (collapse consecutive marked)
      let marked = ch;
      let j = i + 1;
      let k = qi + 1;
      while (j < tl.length && k < qlc.length && tl.charAt(j).toLowerCase() === qlc.charAt(k)) {
        marked += tl.charAt(j);
        j++;
        k++;
      }
      parts.push({ text: marked, mark: true });
      i = j - 1;
      qi = k;
    } else {
      buffer += ch;
    }
  }
  if (buffer) parts.push({ text: buffer, mark: false });

  // If nothing matched, return original text
  const anyMarked = parts.some(p => p.mark);
  if (!anyMarked) return tl;

  return (
    <>
      {parts.map((p, idx) =>
        p.mark ? (
          <mark key={idx} className="bg-yellow-200 text-inherit px-0.5 rounded-sm">{p.text}</mark>
        ) : (
          <span key={idx}>{p.text}</span>
        )
      )}
    </>
  );
}

export function TagSearch() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Tag[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSearch = useMemo(() => q.trim().length >= 2, [q]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
  async function run() {
      if (!canSearch) {
        setResults(null);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const url = `/api/tags?type=search&query=${encodeURIComponent(q.trim())}&limit=50`;
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();
        if (!active) return;
        if (res.ok) {
          setResults(Array.isArray(data?.tags) ? data.tags : []);
        } else {
          setError(data?.error || 'Search failed');
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') setError('Search failed');
      } finally {
        if (active) setLoading(false);
      }
    }
    const t = setTimeout(run, 250);
    return () => {
      active = false;
      controller.abort();
      clearTimeout(t);
    };
  }, [q, canSearch]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <label htmlFor="tag-search" className="mb-2 block text-sm font-medium text-gray-700">
        Search Tags
      </label>
      <input
        id="tag-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Type at least 2 characters..."
        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading && (
        <div className="mt-3 text-sm text-gray-500">Searching…</div>
      )}
      {error && (
        <div className="mt-3 text-sm text-red-600">{error}</div>
      )}
      {results && (
        <div className="mt-4">
          {results.length === 0 ? (
            <div className="text-sm text-gray-500">No tags found.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {results.map((tag) => (
                <li key={tag.id} className="flex items-center justify-between py-2">
                  <Link
                    href={`/tags/${tag.slug}`}
                    className="text-sm font-medium text-gray-900 hover:text-blue-700"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900">{highlightFuzzy(tag.name, q)}</span>
                      <span className="mt-0.5 block truncate text-xs text-gray-500">{highlightFuzzy(`#${tag.slug}`, q)}</span>
                    </span>
                  </Link>
                  {typeof tag.postCount === 'number' && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {tag.postCount}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
