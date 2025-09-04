/** Markup Pipeline: Markdown -> Emoji -> Sanitization */
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { addFilter, LegacyFilters } from '@/src/lib/triggers';

// Basic emoji map; extend as needed.
const emojiMap: Record<string,string> = { ':smile:':'😄', ':heart:':'❤️', ':thumbsup:':'👍' };

function emojiReplace(html: string): string {
  return html.replace(/:(smile|heart|thumbsup):/g, (m) => emojiMap[m] || m);
}

// Register filters (priority ordering: markdown (5), emoji (10), sanitize (20))
addFilter(LegacyFilters.MARKUP_TEXT, async (value: string) => marked.parse(value || ''), 5);
addFilter(LegacyFilters.MARKUP_TEXT, async (value: string) => emojiReplace(value), 10);
addFilter(LegacyFilters.MARKUP_TEXT, async (value: string) => DOMPurify.sanitize(value), 20);

addFilter(LegacyFilters.MARKUP_COMMENT_TEXT, async (value: string) => marked.parseInline(value || ''), 5);
addFilter(LegacyFilters.MARKUP_COMMENT_TEXT, async (value: string) => emojiReplace(value), 10);
addFilter(LegacyFilters.MARKUP_COMMENT_TEXT, async (value: string) => DOMPurify.sanitize(value), 20);

// Excerpt filter: ensure length and plain text fallback
addFilter(LegacyFilters.EXCERPT, async (value: string) => {
  if (!value) return value;
  const plain = value.replace(/<[^>]+>/g,'');
  return plain.length > 240 ? plain.slice(0,237) + '…' : plain;
}, 15);
