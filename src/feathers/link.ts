/**
 * Link Feather - External link posts
 * For sharing links with rich previews and metadata
 */

import { z } from 'zod';

import { registerFeather, type FeatherRenderer, type FeatherExcerptGenerator } from '../lib/feathers/registry';

// Schema for link feather payload
export const LinkFeatherSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  title: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().url().optional().or(z.literal('')),
  siteName: z.string().optional(),
  showPreview: z.boolean().default(true),
  openInNewTab: z.boolean().default(true),
});

export type LinkFeatherPayload = z.infer<typeof LinkFeatherSchema>;

// Field definitions for admin UI
const linkFields = [
  {
    name: 'url',
    type: 'url' as const,
    label: 'URL',
    required: true,
    placeholder: 'https://example.com',
  },
  {
    name: 'title',
    type: 'text' as const,
    label: 'Title',
    required: false,
    placeholder: 'Link title (auto-detected if empty)',
  },
  {
    name: 'description',
    type: 'textarea' as const,
    label: 'Description',
    required: false,
    placeholder: 'Brief description (auto-detected if empty)',
  },
  {
    name: 'thumbnail',
    type: 'url' as const,
    label: 'Thumbnail URL',
    required: false,
    placeholder: 'Image URL for preview',
  },
  {
    name: 'siteName',
    type: 'text' as const,
    label: 'Site Name',
    required: false,
    placeholder: 'Name of the linked site',
  },
  {
    name: 'showPreview',
    type: 'checkbox' as const,
    label: 'Show Preview Card',
    required: false,
  },
  {
    name: 'openInNewTab',
    type: 'checkbox' as const,
    label: 'Open in New Tab',
    required: false,
  },
];

// Render function
async function renderLink(payload: LinkFeatherPayload): Promise<string> {
  const escapeHtml = (text: string) =>
    text.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

  const url = escapeHtml(payload.url);
  const target = payload.openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
  const title = payload.title || payload.url;

  if (!payload.showPreview || (!payload.title && !payload.description && !payload.thumbnail)) {
    // Simple link without preview
    return `<p class="link-simple"><a href="${url}"${target}>${escapeHtml(title)}</a></p>`;
  }

  // Rich preview card
  let html = `<div class="link-preview">`;

  if (payload.thumbnail) {
    html += `<div class="link-thumbnail">`;
    html += `<a href="${url}"${target}><img src="${escapeHtml(payload.thumbnail)}" alt="${escapeHtml(title)}" loading="lazy"></a>`;
    html += `</div>`;
  }

  html += `<div class="link-content">`;

  if (payload.title) {
    html += `<h3 class="link-title"><a href="${url}"${target}>${escapeHtml(payload.title)}</a></h3>`;
  }

  if (payload.description) {
    html += `<p class="link-description">${escapeHtml(payload.description)}</p>`;
  }

  html += `<div class="link-meta">`;
  if (payload.siteName) {
    html += `<span class="link-site">${escapeHtml(payload.siteName)}</span>`;
  }
  html += `<span class="link-url">${escapeHtml(new URL(payload.url).hostname)}</span>`;
  html += `</div>`;

  html += `</div></div>`;

  return html;
}

// Generate excerpt from link
function generateLinkExcerpt(payload: LinkFeatherPayload): string {
  const title = payload.title || payload.url;
  const hostname = new URL(payload.url).hostname;

  if (payload.description) {
    const description = payload.description.length > 100
      ? payload.description.slice(0, 97).trim() + '...'
      : payload.description;
    return `${title} — ${description} (${hostname})`;
  }

  return `${title} (${hostname})`;
}

// Register the feather
registerFeather(
  {
    slug: 'link',
    name: 'Link',
    version: '1.0.0',
    description: 'External link posts with rich previews and metadata',
    schema: LinkFeatherSchema,
    fields: linkFields,
  },
  renderLink as FeatherRenderer,
  generateLinkExcerpt as FeatherExcerptGenerator
);

export { LinkFeatherSchema as schema, renderLink as render, generateLinkExcerpt as excerpt };
