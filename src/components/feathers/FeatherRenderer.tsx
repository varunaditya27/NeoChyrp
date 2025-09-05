/**
 * FeatherRenderer Component
 * Safely renders HTML content from feathers
 */

"use client";

import DOMPurify from 'isomorphic-dompurify';
import React, { useEffect, useState } from 'react';

interface FeatherRendererProps {
  html: string;
  className?: string;
  featherType?: string;
}

export function FeatherRenderer({ html, className = '', featherType }: FeatherRendererProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    try {
      if (!html || html.trim() === '') {
        setHasError(true);
        return;
      }

      // Sanitize the HTML content to prevent XSS
      const cleanHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        // Text content
        'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote',
        'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'span', 'div', 'small',

        // Media elements
        'video', 'audio', 'source', 'iframe',

        // Custom classes for feather styling
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'id',
        'controls', 'autoplay', 'muted', 'loop', 'poster',
        'width', 'height', 'frameborder', 'allowfullscreen',
        'data-lightbox', 'data-*', 'target', 'rel',
        'loading', 'type', 'preload'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    });

    setSanitizedHtml(cleanHtml);
    setHasError(false);
    } catch (error) {
      console.error('Error sanitizing feather HTML:', error);
      setHasError(true);
    }
  }, [html]);

  // Handle error state
  if (hasError) {
    return (
      <div className="feather-error">
        <strong>Content Error</strong>
        <p>This {featherType || 'content'} could not be displayed properly.</p>
      </div>
    );
  }

  // Add feather-specific classes
  const featherClass = featherType ? `feather-${featherType.toLowerCase()}` : '';
  const combinedClassName = `feather-content ${featherClass} ${className}`.trim();

  return (
    <div
      className={combinedClassName}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

/**
 * Async wrapper for server-side rendering
 */
interface AsyncFeatherRendererProps {
  renderPromise: Promise<string>;
  className?: string;
  featherType?: string;
  fallback?: React.ReactNode;
}

export function AsyncFeatherRenderer({
  renderPromise,
  className,
  featherType,
  fallback = <div className="animate-pulse bg-gray-200 h-20 rounded"></div>
}: AsyncFeatherRendererProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    renderPromise
      .then(setHtml)
      .catch((err) => {
        console.error('Error rendering feather content:', err);
        setError(err.message);
      });
  }, [renderPromise]);

  if (error) {
    return (
      <div className="border-l-4 border-red-400 bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error rendering content
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (html === null) {
    return <>{fallback}</>;
  }

  return (
    <FeatherRenderer
      html={html}
      className={className}
      featherType={featherType}
    />
  );
}
