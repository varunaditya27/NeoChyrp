/**
 * Video Feather - Video posts
 * For uploading and embedding videos with captions and controls
 */

import { z } from 'zod';

import { registerFeather, type FeatherRenderer, type FeatherExcerptGenerator } from '../lib/feathers/registry';

// Schema for video feather payload
export const VideoFeatherSchema = z.object({
  videoUrl: z.string().url('Must be a valid video URL'),
  videoType: z.enum(['mp4', 'webm', 'ogg', 'youtube', 'vimeo']).optional(),
  posterUrl: z.string().url().optional().or(z.literal('')),
  title: z.string().optional(),
  description: z.string().optional(),
});

export type VideoFeatherPayload = z.infer<typeof VideoFeatherSchema>;

// Field definitions for admin UI
const videoFields = [
  {
    name: 'videoUrl',
    type: 'media' as const,
    label: 'Video',
    required: true,
    placeholder: 'Upload a video file or paste a YouTube/Vimeo/MP4 URL',
    accept: 'video/*',
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
];

// Helper function to extract video ID from YouTube/Vimeo URLs
function detectVideoType(url: string): 'youtube' | 'vimeo' | 'mp4' | 'webm' | 'ogg' | null {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
    if (host.includes('vimeo.com')) return 'vimeo';
    const path = u.pathname.toLowerCase();
    if (path.endsWith('.mp4')) return 'mp4';
    if (path.endsWith('.webm')) return 'webm';
    if (path.endsWith('.ogg') || path.endsWith('.ogv')) return 'ogg';
    return null;
  } catch {
    return null;
  }
}

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

  const resolvedType = payload.videoType || detectVideoType(payload.videoUrl) || 'mp4';

  // Handle different video types
  if (resolvedType === 'youtube') {
    const videoId = extractVideoId(payload.videoUrl, 'youtube');
    if (videoId) {
  const params = new URLSearchParams();

      const embedUrl = `https://www.youtube.com/embed/${videoId}${params.toString() ? '?' + params.toString() : ''}`;

      html += `<div class="video-embed youtube-embed">`;
      html += `<iframe src="${embedUrl}" frameborder="0" allowfullscreen`;
      html += `></iframe></div>`;
    }
  } else if (resolvedType === 'vimeo') {
    const videoId = extractVideoId(payload.videoUrl, 'vimeo');
    if (videoId) {
  const params = new URLSearchParams();

      const embedUrl = `https://player.vimeo.com/video/${videoId}${params.toString() ? '?' + params.toString() : ''}`;

      html += `<div class="video-embed vimeo-embed">`;
      html += `<iframe src="${embedUrl}" frameborder="0" allowfullscreen`;
      html += `></iframe></div>`;
    }
  } else {
    // Native HTML5 video
    html += `<video class="video-player" controls`;
    if (payload.posterUrl) html += ` poster="${escapeHtml(payload.posterUrl)}"`;

    html += `>`;
    html += `<source src="${escapeHtml(payload.videoUrl)}" type="video/${resolvedType}">`;
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
  const type = (payload.videoType || detectVideoType(payload.videoUrl) || 'mp4').toUpperCase();

  if (payload.description) {
    const description = payload.description.length > 100
      ? payload.description.slice(0, 97).trim() + '...'
      : payload.description;
    return `${title} (${type}) — ${description}`;
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
