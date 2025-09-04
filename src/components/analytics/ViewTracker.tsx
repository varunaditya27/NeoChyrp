"use client";
import { useEffect, useRef } from 'react';

interface ViewTrackerProps { postId: string; }

// Registers a view once per page load & when tab returns after 5+ minutes.
export function ViewTracker({ postId }: ViewTrackerProps) {
  const lastSent = useRef<number>(0);
  async function send() {
    const now = Date.now();
    if (now - lastSent.current < 60_000) return; // throttle 1m
    lastSent.current = now;
    try {
      const base = process.env.NEXT_PUBLIC_SITE_URL || '';
      await fetch(`${base}/api/posts/${postId}/view`, { method: 'POST' });
    } catch { /* ignore */ }
  }
  useEffect(() => {
    send();
    function onVis() { if (document.visibilityState === 'visible') send(); }
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);
  return null;
}

export default ViewTracker;
