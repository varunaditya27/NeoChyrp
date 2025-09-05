/**
 * Photo Feather - Image-centric posts
 * For sharing photographs with captions and metadata
 */

import { z } from 'zod';

import { registerFeather, type FeatherRenderer, type FeatherExcerptGenerator } from '../lib/feathers/registry';

// Schema for photo feather payload
export const PhotoFeatherSchema = z.object({
  imageId: z.string().min(1, 'Image is required'),
  caption: z.string().optional(),
  altText: z.string().optional(),
  showImageInfo: z.boolean().default(false),
  enableLightbox: z.boolean().default(true),
});

export type PhotoFeatherPayload = z.infer<typeof PhotoFeatherSchema>;

// Field definitions for admin UI
const photoFields = [
  {
    name: 'imageId',
    type: 'media' as const,
    label: 'Image',
    required: true,
  },
  {
    name: 'caption',
    type: 'textarea' as const,
    label: 'Caption',
    required: false,
    placeholder: 'Add a caption for your photo...',
  },
  {
    name: 'altText',
    type: 'text' as const,
    label: 'Alt Text',
    required: false,
    placeholder: 'Describe the image for accessibility...',
  },
  {
    name: 'showImageInfo',
    type: 'boolean' as const,
    label: 'Show Image Information',
    required: false,
  },
  {
    name: 'enableLightbox',
    type: 'boolean' as const,
    label: 'Enable Lightbox',
    required: false,
  },
];

// Render function
async function renderPhoto(payload: PhotoFeatherPayload): Promise<string> {
  // Handle both asset ID (preferred) and full URL (legacy)
  let imageUrl: string;
  if (payload.imageId.startsWith('http')) {
    // Full URL stored (legacy case)
    imageUrl = payload.imageId;
  } else {
    // Asset ID stored (preferred case)
    imageUrl = `/api/assets/${payload.imageId}`;
  }

  const altText = payload.altText || payload.caption || 'Photo';

  console.log('Photo feather rendering:', { imageId: payload.imageId, imageUrl });

  let html = `<div class="photo-post">`;

  if (payload.enableLightbox) {
    html += `<a href="${imageUrl}" class="lightbox-trigger" data-lightbox="photo">`;
  }

  html += `<img src="${imageUrl}" alt="${altText}" class="photo-image" loading="lazy" />`;

  if (payload.enableLightbox) {
    html += `</a>`;
  }

  if (payload.caption) {
    html += `<div class="photo-caption">${payload.caption}</div>`;
  }

  if (payload.showImageInfo) {
    html += `<div class="photo-info">
      <small class="text-gray-500">
        <!-- Image metadata will be loaded here -->
      </small>
    </div>`;
  }

  html += `</div>`;

  return html;
}

// Generate excerpt from photo
function generatePhotoExcerpt(payload: PhotoFeatherPayload): string {
  if (payload.caption) {
    return payload.caption.length > 160
      ? payload.caption.slice(0, 157).trim() + '...'
      : payload.caption;
  }

  return 'Photo post';
}

// Register the feather
registerFeather(
  {
    slug: 'photo',
    name: 'Photo',
    version: '1.0.0',
    description: 'Image posts with captions and lightbox support',
    schema: PhotoFeatherSchema,
    fields: photoFields,
  },
  renderPhoto as FeatherRenderer,
  generatePhotoExcerpt as FeatherExcerptGenerator
);

export { PhotoFeatherSchema as schema, renderPhoto as render, generatePhotoExcerpt as excerpt };
