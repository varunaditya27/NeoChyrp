"use client";
import { useState, useEffect } from 'react';

export default function ThemePreviewToggle() {
  const [theme, setTheme] = useState<string>('');
  const [persisted, setPersisted] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem('previewTheme');
    if (stored) { setPersisted(stored); setTheme(stored); }
  }, []);

  function apply(newTheme: string) {
    setTheme(newTheme);
    document.cookie = `preview_theme=${encodeURIComponent(newTheme)}; path=/; max-age=${60*60}`;
    localStorage.setItem('previewTheme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }

  return (
    <div className="space-y-2 p-4 border rounded bg-white shadow-sm">
      <h3 className="font-semibold text-sm">Theme Preview</h3>
      <div className="flex gap-2 flex-wrap">
        {['light','dark','solarized'].map(t => (
          <button key={t} onClick={() => apply(t)} className={`px-2 py-1 text-xs rounded border ${theme===t?'bg-blue-600 text-white':'bg-gray-100'}`}>{t}</button>
        ))}
        <button onClick={() => apply('')} className="px-2 py-1 text-xs rounded border bg-gray-50">Clear</button>
      </div>
      {persisted && <p className="text-[10px] text-gray-500">Preview active: {persisted}</p>}
    </div>
  );
}
