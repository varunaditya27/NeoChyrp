import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';
import { z } from 'zod';

import { registerFeather, type FeatherRenderer, type FeatherExcerptGenerator } from '@/src/lib/feathers/registry';

// Schema for text feather payload
export const TextFeatherSchema = z.object({
  markdown: z.string().min(1, 'Content is required'),
  enableComments: z.boolean().default(true),
  allowRichFormatting: z.boolean().default(true),
});

export type TextFeatherPayload = z.infer<typeof TextFeatherSchema>;

// Field definitions for admin UI
const textFields = [
  {
    name: 'markdown',
    type: 'markdown' as const,
    label: 'Content',
    required: true,
    placeholder: 'Write your post content in Markdown...',
  },
  {
    name: 'enableComments',
    type: 'boolean' as const,
    label: 'Enable Comments',
    required: false,
  },
  {
    name: 'allowRichFormatting',
    type: 'boolean' as const,
    label: 'Allow Rich Formatting',
    required: false,
  },
];

// Configure marked for security and consistency
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Render function
async function renderText(payload: TextFeatherPayload): Promise<string> {
  let html = await marked(payload.markdown);

  // Sanitize HTML to prevent XSS
  html = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  });

  return html;
}

// Generate excerpt from markdown
function generateTextExcerpt(payload: TextFeatherPayload): string {
  // Remove markdown formatting and get plain text
  const plainText = payload.markdown
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Remove images, keep alt text
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();

  // Limit to 160 characters for excerpt
  return plainText.length > 160
    ? plainText.slice(0, 157).trim() + '...'
    : plainText;
}

// Register the feather
registerFeather(
  {
    slug: 'TEXT',
    name: 'Text',
    version: '1.0.0',
    description: 'Standard textual blog posts with Markdown support',
    schema: TextFeatherSchema,
    fields: textFields,
  },
  renderText as FeatherRenderer,
  generateTextExcerpt as FeatherExcerptGenerator
);

export { TextFeatherSchema as schema, renderText as render, generateTextExcerpt as excerpt };
