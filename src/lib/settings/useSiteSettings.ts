"use client";
import { useEffect, useState } from 'react';

interface SiteSettings { title: string; tagline: string; theme?: string }

export function useSiteSettings() {
  const [data, setData] = useState<SiteSettings>({ title: 'NeoChyrp', tagline: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
  fetch('/api/settings/public')
      .then(r => r.json())
      .then(res => { if (!mounted) return; if (res.success) setData(res.data); else setError(res.error || 'Failed'); })
      .catch(e => { if (mounted) setError(e.message); })
      .finally(()=> mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);
  return { ...data, loading, error };
}
