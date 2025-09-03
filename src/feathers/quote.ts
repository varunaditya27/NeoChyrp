/**
 * Quote Feather - Quotation posts
 * For sharing quotes with proper attribution
 */

import { z } from 'zod';

import { registerFeather, type FeatherRenderer, type FeatherExcerptGenerator } from '../lib/feathers/registry';

// Schema for quote feather payload
export const QuoteFeatherSchema = z.object({
  quote: z.string().min(1, 'Quote text is required'),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  context: z.string().optional(),
  style: z.enum(['standard', 'pullquote', 'minimal']).default('standard'),
});

export type QuoteFeatherPayload = z.infer<typeof QuoteFeatherSchema>;

// Field definitions for admin UI
const quoteFields = [
  {
    name: 'quote',
    type: 'textarea' as const,
    label: 'Quote',
    required: true,
    placeholder: 'Enter the quote text...',
  },
  {
    name: 'source',
    type: 'text' as const,
    label: 'Source/Author',
    required: false,
    placeholder: 'Who said this quote?',
  },
  {
    name: 'sourceUrl',
    type: 'url' as const,
    label: 'Source URL',
    required: false,
    placeholder: 'Link to the original source...',
  },
  {
    name: 'context',
    type: 'textarea' as const,
    label: 'Context',
    required: false,
    placeholder: 'Additional context or commentary...',
  },
  {
    name: 'style',
    type: 'select' as const,
    label: 'Style',
    required: false,
    options: [
      { value: 'standard', label: 'Standard' },
      { value: 'pullquote', label: 'Pull Quote' },
      { value: 'minimal', label: 'Minimal' },
    ],
  },
];

// Render function
async function renderQuote(payload: QuoteFeatherPayload): Promise<string> {
  const escapeHtml = (text: string) =>
    text.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

  const quoteText = escapeHtml(payload.quote);
  const styleClass = `quote-${payload.style}`;

  let html = `<blockquote class="${styleClass}">`;
  html += `<div class="quote-text">${quoteText}</div>`;

  if (payload.source) {
    html += `<footer class="quote-attribution">`;

    if (payload.sourceUrl) {
      html += `<cite><a href="${escapeHtml(payload.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(payload.source)}</a></cite>`;
    } else {
      html += `<cite>${escapeHtml(payload.source)}</cite>`;
    }

    html += `</footer>`;
  }

  html += `</blockquote>`;

  if (payload.context) {
    html += `<div class="quote-context">${escapeHtml(payload.context)}</div>`;
  }

  return html;
}

// Generate excerpt from quote
function generateQuoteExcerpt(payload: QuoteFeatherPayload): string {
  const quote = payload.quote.length > 160
    ? payload.quote.slice(0, 157).trim() + '...'
    : payload.quote;

  return `"${quote}"` + (payload.source ? ` — ${payload.source}` : '');
}

// Register the feather
registerFeather(
  {
    slug: 'quote',
    name: 'Quote',
    version: '1.0.0',
    description: 'Quotation posts with attribution and styling options',
    schema: QuoteFeatherSchema,
    fields: quoteFields,
  },
  renderQuote as FeatherRenderer,
  generateQuoteExcerpt as FeatherExcerptGenerator
);

export { QuoteFeatherSchema as schema, renderQuote as render, generateQuoteExcerpt as excerpt };
