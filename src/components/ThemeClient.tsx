"use client";
import { useEffect } from 'react';

function applyTheme(t: string) {
  const root = document.documentElement;
  if (t === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = prefersDark ? 'dark' : 'light';
  } else {
    root.dataset.theme = t;
  }
  if (root.dataset.theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export default function ThemeClient() {
  useEffect(() => {
    // Initial sync (server may have set placeholder)
    fetch('/api/settings/public').then(r => r.json()).then(res => {
      if (res.success) applyTheme(res.data.theme || 'light');
    });
    const listener = () => {
      fetch('/api/settings/public?ts=' + Date.now()).then(r => r.json()).then(res => {
        if (res.success) applyTheme(res.data.theme || 'light');
      });
    };
    window.addEventListener('settings:updated', listener);
    // react to system changes when in auto mode
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const mqHandler = () => {
      const current = document.documentElement.dataset.theme;
      if (current === 'dark' || current === 'light') return; // only auto cares
      applyTheme('auto');
    };
    mq.addEventListener('change', mqHandler);
    return () => { window.removeEventListener('settings:updated', listener); mq.removeEventListener('change', mqHandler); };
  }, []);
  return null;
}
