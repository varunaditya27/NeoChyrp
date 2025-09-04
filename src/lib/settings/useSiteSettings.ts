"use client";
import { useEffect, useState, useCallback } from 'react';

interface SiteSettings { title: string; tagline: string; theme?: string }

export function useSiteSettings() {
  const [data, setData] = useState<SiteSettings>({ title: 'NeoChyrp', tagline: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/settings/public', { cache: 'no-store' })
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
    const handler = () => load();
    window.addEventListener('settings:updated', handler);
    return () => window.removeEventListener('settings:updated', handler);
  }, [load]);

  return { ...data, loading, error, refresh: load };
}
