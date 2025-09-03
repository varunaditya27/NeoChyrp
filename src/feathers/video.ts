/**
 * Video Feather - Video posts
 * For uploading and embedding videos with captions and controls
 */

import { z } from 'zod';

import { registerFeather, type FeatherRenderer, type FeatherExcerptGenerator } from '../lib/feathers/registry';

// Schema for video feather payload
export const VideoFeatherSchema = z.object({
  videoUrl: z.string().url('Must be a valid video URL'),
  videoType: z.enum(['mp4', 'webm', 'ogg', 'youtube', 'vimeo', 'other']).default('mp4'),
  posterUrl: z.string().url().optional().or(z.literal('')),
  title: z.string().optional(),
  description: z.string().optional(),
  duration: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  autoplay: z.boolean().default(false),
  muted: z.boolean().default(false),
  loop: z.boolean().default(false),
  controls: z.boolean().default(true),
});

export type VideoFeatherPayload = z.infer<typeof VideoFeatherSchema>;

// Field definitions for admin UI
const videoFields = [
  {
    name: 'videoUrl',
    type: 'url' as const,
    label: 'Video URL',
    required: true,
    placeholder: 'https://example.com/video.mp4 or YouTube/Vimeo URL',
  },
  {
    name: 'videoType',
    type: 'select' as const,
    label: 'Video Type',
    required: false,
    options: [
      { value: 'mp4', label: 'MP4' },
      { value: 'webm', label: 'WebM' },
      { value: 'ogg', label: 'OGG' },
      { value: 'youtube', label: 'YouTube' },
      { value: 'vimeo', label: 'Vimeo' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    name: 'posterUrl',
    type: 'url' as const,
    label: 'Poster Image URL',
    required: false,
    placeholder: 'Thumbnail image for the video',
  },
  {
    name: 'title',
    type: 'text' as const,
    label: 'Video Title',
    required: false,
    placeholder: 'Descriptive title for the video',
  },
  {
    name: 'description',
    type: 'textarea' as const,
    label: 'Description',
    required: false,
    placeholder: 'Brief description of the video content',
  },
  {
    name: 'duration',
    type: 'number' as const,
    label: 'Duration (seconds)',
    required: false,
    placeholder: 'Length of the video in seconds',
  },
  {
    name: 'width',
    type: 'number' as const,
    label: 'Width',
    required: false,
    placeholder: 'Video width in pixels',
  },
  {
    name: 'height',
    type: 'number' as const,
    label: 'Height',
    required: false,
    placeholder: 'Video height in pixels',
  },
  {
    name: 'autoplay',
    type: 'checkbox' as const,
    label: 'Autoplay',
    required: false,
  },
  {
    name: 'muted',
    type: 'checkbox' as const,
    label: 'Muted',
    required: false,
  },
  {
    name: 'loop',
    type: 'checkbox' as const,
    label: 'Loop',
    required: false,
  },
  {
    name: 'controls',
    type: 'checkbox' as const,
    label: 'Show Controls',
    required: false,
  },
];

// Helper function to extract video ID from YouTube/Vimeo URLs
function extractVideoId(url: string, type: string): string | null {
  try {
    const urlObj = new URL(url);

    if (type === 'youtube') {
      // Handle various YouTube URL formats
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v');
      } else if (urlObj.hostname.includes('youtu.be')) {
        return urlObj.pathname.slice(1);
      }
    } else if (type === 'vimeo') {
      // Handle Vimeo URLs
      if (urlObj.hostname.includes('vimeo.com')) {
        const match = urlObj.pathname.match(/\/(\d+)/);
        return match && match[1] ? match[1] : null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Render function
async function renderVideo(payload: VideoFeatherPayload): Promise<string> {
  const escapeHtml = (text: string) =>
    text.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

  let html = '<div class="video-container">';

  if (payload.title) {
    html += `<h3 class="video-title">${escapeHtml(payload.title)}</h3>`;
  }

  // Handle different video types
  if (payload.videoType === 'youtube') {
    const videoId = extractVideoId(payload.videoUrl, 'youtube');
    if (videoId) {
      const params = new URLSearchParams();
      if (payload.autoplay) params.append('autoplay', '1');
      if (payload.muted) params.append('mute', '1');
      if (payload.loop) params.append('loop', '1');
      if (!payload.controls) params.append('controls', '0');

      const embedUrl = `https://www.youtube.com/embed/${videoId}${params.toString() ? '?' + params.toString() : ''}`;

      html += `<div class="video-embed youtube-embed">`;
      html += `<iframe src="${embedUrl}" frameborder="0" allowfullscreen`;
      if (payload.width && payload.height) {
        html += ` width="${payload.width}" height="${payload.height}"`;
      }
      html += `></iframe></div>`;
    }
  } else if (payload.videoType === 'vimeo') {
    const videoId = extractVideoId(payload.videoUrl, 'vimeo');
    if (videoId) {
      const params = new URLSearchParams();
      if (payload.autoplay) params.append('autoplay', '1');
      if (payload.muted) params.append('muted', '1');
      if (payload.loop) params.append('loop', '1');

      const embedUrl = `https://player.vimeo.com/video/${videoId}${params.toString() ? '?' + params.toString() : ''}`;

      html += `<div class="video-embed vimeo-embed">`;
      html += `<iframe src="${embedUrl}" frameborder="0" allowfullscreen`;
      if (payload.width && payload.height) {
        html += ` width="${payload.width}" height="${payload.height}"`;
      }
      html += `></iframe></div>`;
    }
  } else {
    // Native HTML5 video
    html += `<video class="video-player"`;

    if (payload.controls) html += ` controls`;
    if (payload.autoplay) html += ` autoplay`;
    if (payload.muted) html += ` muted`;
    if (payload.loop) html += ` loop`;
    if (payload.posterUrl) html += ` poster="${escapeHtml(payload.posterUrl)}"`;
    if (payload.width && payload.height) {
      html += ` width="${payload.width}" height="${payload.height}"`;
    }

    html += `>`;
    html += `<source src="${escapeHtml(payload.videoUrl)}" type="video/${payload.videoType}">`;
    html += `<p>Your browser doesn't support HTML5 video. <a href="${escapeHtml(payload.videoUrl)}">Download the video</a> instead.</p>`;
    html += `</video>`;
  }

  if (payload.description) {
    html += `<p class="video-description">${escapeHtml(payload.description)}</p>`;
  }

  html += '</div>';

  return html;
}

// Generate excerpt from video
function generateVideoExcerpt(payload: VideoFeatherPayload): string {
  const title = payload.title || 'Video';
  const type = payload.videoType.toUpperCase();

  if (payload.description) {
    const description = payload.description.length > 100
      ? payload.description.slice(0, 97).trim() + '...'
      : payload.description;
    return `${title} (${type}) — ${description}`;
  }

  if (payload.duration) {
    const minutes = Math.floor(payload.duration / 60);
    const seconds = payload.duration % 60;
    const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    return `${title} (${type}, ${durationStr})`;
  }

  return `${title} (${type})`;
}

// Register the feather
registerFeather(
  {
    slug: 'video',
    name: 'Video',
    version: '1.0.0',
    description: 'Video posts with support for uploads and embeds',
    schema: VideoFeatherSchema,
    fields: videoFields,
  },
  renderVideo as FeatherRenderer,
  generateVideoExcerpt as FeatherExcerptGenerator
);

export { VideoFeatherSchema as schema, renderVideo as render, generateVideoExcerpt as excerpt };
