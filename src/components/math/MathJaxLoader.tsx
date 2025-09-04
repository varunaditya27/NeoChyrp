"use client";
import { useEffect, useRef } from 'react';

interface MathJaxLoaderProps { rootSelector?: string; }

declare global { // MathJax ambient
  interface Window { MathJax?: any; }
}

export function MathJaxLoader({ rootSelector = '.prose' }: MathJaxLoaderProps) {
  const loaded = useRef(false);
  useEffect(() => {
    function typeset() {
      if (window.MathJax && typeof window.MathJax.typeset === 'function') {
        try {
          const root = document.querySelector(rootSelector);
          if (root) {
            window.MathJax.typeset([root]);
          } else {
            window.MathJax.typeset();
          }
        } catch { /* ignore */ }
      }
    }

    function inject() {
      // Configure BEFORE script is loaded (MathJax v3 config pattern)
      (window as any).MathJax = (window as any).MathJax || {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']],
          processEscapes: true,
          processEnvironments: true
        },
        options: {
          skipHtmlTags: ['script','noscript','style','textarea','pre','code'],
        }
      };
      const script = document.createElement('script');
      script.id = 'mathjax-script';
      script.async = true;
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script.onload = () => setTimeout(typeset, 30);
      document.head.appendChild(script);
    }

    if (!loaded.current) {
      if (!document.getElementById('mathjax-script')) {
        inject();
      } else {
        typeset();
      }
      loaded.current = true;
    } else {
      typeset();
    }

    const observer = new MutationObserver(() => {
      setTimeout(typeset, 10); // Small delay to ensure DOM is ready
    });
    const root = document.querySelector(rootSelector);
    if (root) observer.observe(root, { childList: true, subtree: true });

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') typeset();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [rootSelector]);
  return null;
}

export default MathJaxLoader;
