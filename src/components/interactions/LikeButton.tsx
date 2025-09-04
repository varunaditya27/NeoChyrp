"use client";
import React from 'react';

import { useLike } from './useLike';

interface LikeButtonProps {
  postId: string;
  initialCount?: number;
  size?: 'sm' | 'md';
}

export const LikeButton: React.FC<LikeButtonProps> = ({ postId, initialCount = 0, size = 'md' }) => {
  const { liked, count, toggle, loading, error, syncing } = useLike({ postId, initialCount });

  return (
    <div className="inline-flex items-center gap-2">
      {liked ? (
        <button type="button" disabled={loading} onClick={toggle} aria-pressed={liked}
          className={`inline-flex items-center rounded border border-pink-600 bg-pink-600 px-2 py-1 text-xs font-medium text-white transition ${size === 'sm' ? 'text-[11px]' : ''}`}>♥ Liked</button>
      ) : (
        <button type="button" disabled={loading} onClick={toggle} aria-pressed={liked}
          className={`inline-flex items-center rounded border border-pink-300 bg-white px-2 py-1 text-xs font-medium text-pink-600 transition hover:bg-pink-50 ${size === 'sm' ? 'text-[11px]' : ''}`}>♡ Like</button>
      )}
      <span className="text-xs text-gray-500" aria-label="likes count">{count}</span>
      {syncing && <span className="text-[10px] text-gray-400" aria-label="syncing">…</span>}
      {error && <span className="text-[10px] text-red-500">{error}</span>}
    </div>
  );
};

export default LikeButton;
