import { useCallback, useEffect, useRef, useState } from 'react';

interface UseLikeOptions {
	postId: string;
	/** Pre-hydrated like count (from server component) */
	initialCount?: number;
	/** Pre-hydrated liked state (from server component) */
	initialLiked?: boolean;
	/** How long (ms) to debounce rapid toggles before forcing server sync */
	syncDebounceMs?: number;
}

interface UseLikeResult {
	liked: boolean;
	count: number;
	toggle: () => Promise<void>;
	loading: boolean;
	error: string | null;
	syncing: boolean; // background reconciliation in progress
	refresh: () => Promise<void>;
}

// User-aware in-memory cache to prevent stampede on navigation (per session tab)
// Key format: "postId:userId" or "postId:anonymous" for non-logged-in users
const likeCache = new Map<string, { liked: boolean; count: number; ts: number }>();

// Cleanup old cache entries periodically to prevent memory leaks
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

let cleanupTimer: NodeJS.Timeout | null = null;

function scheduleCleanup() {
	if (cleanupTimer) return; // Already scheduled

	cleanupTimer = setTimeout(() => {
		const now = Date.now();
		for (const [key, entry] of likeCache.entries()) {
			if (now - entry.ts > CACHE_TTL) {
				likeCache.delete(key);
			}
		}
		cleanupTimer = null;

		// Schedule next cleanup if cache is not empty
		if (likeCache.size > 0) {
			scheduleCleanup();
		}
	}, CACHE_CLEANUP_INTERVAL);
}

export function useLike({ postId, initialCount = 0, initialLiked = false, syncDebounceMs = 800 }: UseLikeOptions): UseLikeResult {
	const [liked, setLiked] = useState(initialLiked);
	const [count, setCount] = useState(initialCount);
	const [loading, setLoading] = useState(false);
	const [syncing, setSyncing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const pendingToggleRef = useRef<number>(0); // net delta of optimistic toggles not yet confirmed
	const debounceTimer = useRef<NodeJS.Timeout | null>(null);
	const mounted = useRef(true);

	// Get current user session
	const fetchCurrentUser = useCallback(async () => {
		try {
			const base = process.env.NEXT_PUBLIC_SITE_URL || '';
			const res = await fetch(`${base}/api/session`, { cache: 'no-store' });
			if (res.ok) {
				const json = await res.json();
				const userId = json.session?.user?.id || 'anonymous';
				setCurrentUserId(userId);
				return userId;
			}
		} catch (e) {
			console.warn('Failed to fetch user session:', e);
		}
		setCurrentUserId('anonymous');
		return 'anonymous';
	}, []);

	// Generate user-specific cache key
	const getCacheKey = useCallback((userId: string | null) => {
		const userKey = userId || 'anonymous';
		return `${postId}:${userKey}`;
	}, [postId]);

	// Hydrate from memory cache if fresher (5s window) and user-specific
	useEffect(() => {
		mounted.current = true;

		// First, get the current user
		fetchCurrentUser().then(userId => {
			if (!mounted.current) return;

			const cacheKey = getCacheKey(userId);
			const cached = likeCache.get(cacheKey);

			if (cached && Date.now() - cached.ts < 5000) {
				// Use cached data if fresh and for the same user
				setLiked(cached.liked);
				setCount(cached.count);
			} else {
				// Fetch fresh data from server
				refresh();
			}
		});

		return () => {
			mounted.current = false;
			// Clean up any pending debounce timer
			if (debounceTimer.current) {
				clearTimeout(debounceTimer.current);
				debounceTimer.current = null;
			}
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [postId]);

	const refresh = useCallback(async () => {
		try {
			setSyncing(true);

			// Ensure we have current user info
			let userId = currentUserId;
			if (!userId) {
				userId = await fetchCurrentUser();
			}

			const base = process.env.NEXT_PUBLIC_SITE_URL || '';
			const res = await fetch(`${base}/api/likes?postId=${postId}&action=summary`, { cache: 'no-store' });
			if (!res.ok) throw new Error('Failed to load likes');
			const json = await res.json();
			if (typeof json.count === 'number') setCount(json.count);
			if (typeof json.liked === 'boolean') setLiked(json.liked);

			// Cache with user-specific key
			const cacheKey = getCacheKey(userId);
			likeCache.set(cacheKey, { liked: json.liked, count: json.count, ts: Date.now() });
			scheduleCleanup(); // Schedule cleanup when adding to cache

			pendingToggleRef.current = 0; // reset pending diff
		} catch (e:any) {
			setError(e.message);
		} finally {
			if (mounted.current) setSyncing(false);
		}
	}, [postId, currentUserId, fetchCurrentUser, getCacheKey]);

	const reconcile = useCallback(async () => {
		if (pendingToggleRef.current === 0) return; // nothing to reconcile
		await refresh();
	}, [refresh]);

	const scheduleReconcile = useCallback(() => {
		if (debounceTimer.current) clearTimeout(debounceTimer.current);
		debounceTimer.current = setTimeout(() => { reconcile(); }, syncDebounceMs);
	}, [reconcile, syncDebounceMs]);

	const toggle = useCallback(async () => {
		if (loading) return;
		setLoading(true); setError(null);

		// Ensure we have current user info
		let userId = currentUserId;
		if (!userId) {
			userId = await fetchCurrentUser();
		}

		console.log('Toggle like - User:', userId, 'Post:', postId, 'Current liked state:', liked);

		const optimisticLiked = !liked;
		const optimisticCount = count + (optimisticLiked ? 1 : -1);
		setLiked(optimisticLiked);
		setCount(optimisticCount < 0 ? 0 : optimisticCount);

		// Cache with user-specific key
		const cacheKey = getCacheKey(userId);
		console.log('Caching with key:', cacheKey, 'liked:', optimisticLiked, 'count:', optimisticCount);
		likeCache.set(cacheKey, { liked: optimisticLiked, count: Math.max(0, optimisticCount), ts: Date.now() });
		scheduleCleanup(); // Schedule cleanup when adding to cache

		pendingToggleRef.current += optimisticLiked ? 1 : -1;
		scheduleReconcile();
		try {
			const base = process.env.NEXT_PUBLIC_SITE_URL || '';
			const res = await fetch(`${base}/api/likes`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ postId })
			});
			const json = await res.json();
			console.log('Server response:', json);
			if (!res.ok) throw new Error(json.error || 'Failed to toggle like');
			// Server truth adjustment if optimistic drifted
			setLiked(json.liked);
			if (typeof json.count === 'number') setCount(json.count);

			// Update cache with server response
			likeCache.set(cacheKey, { liked: json.liked, count: json.count, ts: Date.now() });
			scheduleCleanup(); // Schedule cleanup when adding to cache
			pendingToggleRef.current = 0;
		} catch (e:any) {
			// revert optimism on failure
			setError(e.message);
			pendingToggleRef.current = 0;
			refresh();
		} finally {
			if (mounted.current) setLoading(false);
		}
	}, [loading, liked, count, postId, currentUserId, fetchCurrentUser, getCacheKey, scheduleReconcile, refresh]);

	// Passive visibility-based reconciliation (ensures long-lived tabs stay fresh without polling)
	useEffect(() => {
		function onVisibility() {
			if (document.visibilityState === 'visible') {
				// Use a stable reference to refresh to avoid infinite loops
				refresh();
			}
		}
		document.addEventListener('visibilitychange', onVisibility);
		return () => document.removeEventListener('visibilitychange', onVisibility);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [postId]); // Only depend on postId, not refresh function

	// Refresh when user changes (handle account switching)
	useEffect(() => {
		if (currentUserId !== null) {
			// Clear cached data for this post across all users when switching
			// to ensure fresh fetch for the new user
			const keysToRemove = Array.from(likeCache.keys()).filter(key => key.startsWith(`${postId}:`));
			keysToRemove.forEach(key => likeCache.delete(key));
			
			console.log('User changed to:', currentUserId, 'for post:', postId, 'cleared keys:', keysToRemove);
			
			// User info is available, refresh to get user-specific like state
			refresh();
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentUserId]);

	return { liked, count, toggle, loading, error, syncing, refresh };
}

export default useLike;
