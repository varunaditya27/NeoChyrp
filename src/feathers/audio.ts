/**
 * Audio Feather - Audio posts
 * For uploading and embedding audio files with metadata
 */

import { z } from 'zod';

import { registerFeather, type FeatherRenderer, type FeatherExcerptGenerator } from '../lib/feathers/registry';

// Schema for audio feather payload
export const AudioFeatherSchema = z.object({
  audioUrl: z.string().url('Must be a valid audio URL'),
  audioType: z.enum(['mp3', 'wav', 'ogg', 'aac', 'flac', 'other']).default('mp3'),
  title: z.string().optional(),
  artist: z.string().optional(),
  album: z.string().optional(),
  duration: z.number().optional(),
  description: z.string().optional(),
  coverArt: z.string().url().optional().or(z.literal('')),
  autoplay: z.boolean().default(false),
  loop: z.boolean().default(false),
  preload: z.enum(['none', 'metadata', 'auto']).default('metadata'),
});

export type AudioFeatherPayload = z.infer<typeof AudioFeatherSchema>;

// Field definitions for admin UI
const audioFields = [
  {
    name: 'audioUrl',
    type: 'url' as const,
    label: 'Audio URL',
    required: true,
    placeholder: 'https://example.com/audio.mp3',
  },
  {
    name: 'audioType',
    type: 'select' as const,
    label: 'Audio Type',
    required: false,
    options: [
      { value: 'mp3', label: 'MP3' },
      { value: 'wav', label: 'WAV' },
      { value: 'ogg', label: 'OGG' },
      { value: 'aac', label: 'AAC' },
      { value: 'flac', label: 'FLAC' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    name: 'title',
    type: 'text' as const,
    label: 'Title',
    required: false,
    placeholder: 'Track or audio title',
  },
  {
    name: 'artist',
    type: 'text' as const,
    label: 'Artist',
    required: false,
    placeholder: 'Artist or performer name',
  },
  {
    name: 'album',
    type: 'text' as const,
    label: 'Album',
    required: false,
    placeholder: 'Album or collection name',
  },
  {
    name: 'duration',
    type: 'number' as const,
    label: 'Duration (seconds)',
    required: false,
    placeholder: 'Length of the audio in seconds',
  },
  {
    name: 'description',
    type: 'textarea' as const,
    label: 'Description',
    required: false,
    placeholder: 'Brief description of the audio content',
  },
  {
    name: 'coverArt',
    type: 'url' as const,
    label: 'Cover Art URL',
    required: false,
    placeholder: 'Album art or thumbnail image',
  },
  {
    name: 'autoplay',
    type: 'checkbox' as const,
    label: 'Autoplay',
    required: false,
  },
  {
    name: 'loop',
    type: 'checkbox' as const,
    label: 'Loop',
    required: false,
  },
  {
    name: 'preload',
    type: 'select' as const,
    label: 'Preload',
    required: false,
    options: [
      { value: 'none', label: 'None' },
      { value: 'metadata', label: 'Metadata' },
      { value: 'auto', label: 'Auto' },
    ],
  },
];

// Render function
async function renderAudio(payload: AudioFeatherPayload): Promise<string> {
  const escapeHtml = (text: string) =>
    text.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

  let html = '<div class="audio-container">';

  // Audio metadata header
  if (payload.title || payload.artist || payload.album || payload.coverArt) {
    html += '<div class="audio-meta">';

    if (payload.coverArt) {
      html += `<div class="audio-cover">`;
      html += `<img src="${escapeHtml(payload.coverArt)}" alt="${escapeHtml(payload.title || 'Audio cover art')}" loading="lazy">`;
      html += `</div>`;
    }

    html += '<div class="audio-info">';

    if (payload.title) {
      html += `<h3 class="audio-title">${escapeHtml(payload.title)}</h3>`;
    }

    if (payload.artist) {
      html += `<p class="audio-artist">by ${escapeHtml(payload.artist)}</p>`;
    }

    if (payload.album) {
      html += `<p class="audio-album">from ${escapeHtml(payload.album)}</p>`;
    }

    if (payload.duration) {
      const minutes = Math.floor(payload.duration / 60);
      const seconds = payload.duration % 60;
      const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      html += `<p class="audio-duration">${durationStr}</p>`;
    }

    html += '</div></div>';
  }

  // Audio player
  html += `<audio class="audio-player" controls`;

  if (payload.autoplay) html += ` autoplay`;
  if (payload.loop) html += ` loop`;
  html += ` preload="${payload.preload}"`;

  html += `>`;
  html += `<source src="${escapeHtml(payload.audioUrl)}" type="audio/${payload.audioType}">`;
  html += `<p>Your browser doesn't support HTML5 audio. <a href="${escapeHtml(payload.audioUrl)}">Download the audio file</a> instead.</p>`;
  html += `</audio>`;

  if (payload.description) {
    html += `<p class="audio-description">${escapeHtml(payload.description)}</p>`;
  }

  html += '</div>';

  return html;
}

// Generate excerpt from audio
function generateAudioExcerpt(payload: AudioFeatherPayload): string {
  const parts = [];

  if (payload.title) {
    parts.push(`"${payload.title}"`);
  }

  if (payload.artist) {
    parts.push(`by ${payload.artist}`);
  }

  if (payload.album) {
    parts.push(`from ${payload.album}`);
  }

  if (payload.duration) {
    const minutes = Math.floor(payload.duration / 60);
    const seconds = payload.duration % 60;
    const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    parts.push(`(${durationStr})`);
  }

  if (parts.length === 0) {
    return `Audio (${payload.audioType.toUpperCase()})`;
  }

  let excerpt = parts.join(' ');

  if (payload.description && excerpt.length < 100) {
    const remainingLength = 150 - excerpt.length - 3; // 3 for ' — '
    if (remainingLength > 20) {
      const description = payload.description.length > remainingLength
        ? payload.description.slice(0, remainingLength - 3).trim() + '...'
        : payload.description;
      excerpt += ` — ${description}`;
    }
  }

  return excerpt;
}

// Register the feather
registerFeather(
  {
    slug: 'audio',
    name: 'Audio',
    version: '1.0.0',
    description: 'Audio posts with player controls and metadata',
    schema: AudioFeatherSchema,
    fields: audioFields,
  },
  renderAudio as FeatherRenderer,
  generateAudioExcerpt as FeatherExcerptGenerator
);

export { AudioFeatherSchema as schema, renderAudio as render, generateAudioExcerpt as excerpt };
