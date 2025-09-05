'use client';

import { formatDistanceToNow } from 'date-fns';
import dynamic from 'next/dynamic';
import React, { useEffect, useState, useCallback } from 'react';

const Maptcha = dynamic(() => import('@/src/components/maptcha/Maptcha').then(m => ({ default: m.Maptcha })), { ssr: false });

type Comment = {
  id: number;
  body: string;
  author?: { displayName: string };
  guestName?: string;
  createdAt: string;
  children?: Comment[];
};

interface CommentsThreadProps { postId: string; }

export const CommentsThread: React.FC<CommentsThreadProps> = ({ postId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [sessionUser, setSessionUser] = useState<{ id: string; username?: string; displayName?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [captcha, setCaptcha] = useState<{ token?: string; answer?: string }>({});

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const base = process.env.NEXT_PUBLIC_SITE_URL || '';
      const res = await fetch(`${base}/api/comments?postId=${postId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setComments(json.comments || []);
    } catch (e:any) { setError(e.message); } finally { setLoading(false); }
  }, [postId]);

  useEffect(() => { load(); }, [load]);
  // Fetch session (lightweight)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const base = process.env.NEXT_PUBLIC_SITE_URL || '';
        const res = await fetch(`${base}/api/session`);
        const json = await res.json();
        if (!active) return;
        setSessionUser(json.session?.user || null);
      } catch { /* ignore */ }
    })();
    return () => { active = false; };
  }, []);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
  if (!body.trim()) return;
    setSubmitting(true); setError(null);
    try {
      const base = process.env.NEXT_PUBLIC_SITE_URL || '';
  const payload: any = { body, postId, captchaToken: captcha.token, captchaAnswer: captcha.answer };
      if (!sessionUser) {
        // Anonymous fallback name to satisfy schema
        payload.guestName = 'Anonymous';
        payload.guestUrl = '';
      }
      const res = await fetch(`${base}/api/comments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
        setBody('');
      setCaptcha({}); // Reset captcha
      // Reload comments to show the new one immediately
      await load();
    } catch (e:any) { setError(e.message); } finally { setSubmitting(false); }
  }

  function renderComment(c: Comment, depth = 0) {
    // Prevent infinite recursion with deeply nested comments
    if (depth > 10) {
      return (
        <li key={c.id} className="mb-4">
          <div className="text-sm italic text-gray-500">
            Comment thread too deep. <button onClick={() => window.location.reload()} className="text-blue-600 underline">Refresh</button> to view.
          </div>
        </li>
      );
    }

    return (
      <li key={c.id} className="mb-4">
        <div className="flex space-x-3">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {(c.author?.displayName || c.guestName || 'G').charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">{c.author?.displayName || c.guestName || 'Guest'}</span>
              <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
            </div>
            <div className="mt-2 text-sm text-gray-700">
              <p className="whitespace-pre-wrap">{c.body}</p>
            </div>
          </div>
        </div>
        {c.children && c.children.length > 0 && depth < 10 && (
          <ul className="ml-12 mt-4 space-y-4">
            {c.children.map(ch => renderComment(ch, depth + 1))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <section className="mt-12" aria-labelledby="comments-title">
      <h2 id="comments-title" className="mb-4 text-lg font-semibold">Comments</h2>
      {loading && <p className="text-sm text-gray-500">Loading comments...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && comments.length === 0 && (
        <div className="mb-8 py-8 text-center text-gray-500">
          <div className="mb-2 text-2xl">💬</div>
          <p className="text-sm">No comments yet. Be the first to comment!</p>
        </div>
      )}
      {comments.length > 0 && (
        <ul className="mb-8 space-y-4">{comments.map(c => renderComment(c))}</ul>
      )}
      <form onSubmit={submitComment} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-medium text-gray-900">Add a comment</h3>
        <div>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            required
            rows={3}
            placeholder="Write a comment... 😊"
            className="w-full resize-none rounded-lg border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <Maptcha onChange={(token, answer) => setCaptcha({ token, answer })} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Posting…' : 'Post'}
            </button>
            <button
              type="button"
              onClick={load}
              className="text-sm text-gray-500 transition-colors hover:text-gray-700"
            >
              Refresh
            </button>
          </div>
          <span className={`text-xs transition-colors ${body.length > 9000 ? 'text-red-500' : body.length > 8000 ? 'text-orange-500' : 'text-gray-400'}`}>
            {body.length}/10000
          </span>
        </div>
      </form>
    </section>
  );
};

export default CommentsThread;
