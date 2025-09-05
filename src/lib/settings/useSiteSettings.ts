"use client";
import { useEffect, useState, useCallback } from 'react';

interface SiteSettings { title: string; tagline: string; theme?: string; description?: string; url?: string }

export function useSiteSettings() {
  const [data, setData] = useState<SiteSettings>({ title: 'NeoChyrp', tagline: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    // Add cache busting parameter to ensure fresh data
    const timestamp = Date.now();
    fetch(`/api/settings/public?t=${timestamp}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setData(res.data);
          setError(null);
        } else {
          setError(res.error || 'Failed');
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Listen for custom event dispatched after server action completes
  useEffect(() => {
    const handler = () => {
      // Add small delay to ensure all caches are cleared
      setTimeout(() => load(), 100);
    };
    window.addEventListener('settings:updated', handler);
    return () => window.removeEventListener('settings:updated', handler);
  }, [load]);

  return { ...data, loading, error, refresh: load };
}
