/**
 * Audio Feather - Audio posts
 * For uploading and embedding audio files with metadata
 */

import { z } from 'zod';

import { registerFeather, type FeatherRenderer, type FeatherExcerptGenerator } from '../lib/feathers/registry';

// Schema for audio feather payload
export const AudioFeatherSchema = z.object({
  audioUrl: z.string().url('Must be a valid audio URL'),
  audioType: z.enum(['mp3', 'wav', 'ogg', 'aac', 'flac']).optional(),
  title: z.string().optional(),
  artist: z.string().optional(),
  description: z.string().optional(),
  coverArt: z.string().url().optional().or(z.literal('')),
});

export type AudioFeatherPayload = z.infer<typeof AudioFeatherSchema>;

// Field definitions for admin UI
const audioFields = [
  {
    name: 'audioUrl',
    type: 'media' as const,
    label: 'Audio',
    required: true,
    placeholder: 'Upload an audio file or paste an MP3/WAV/OGG URL',
    accept: 'audio/*',
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
];

// Render function
function detectAudioType(url: string): 'mp3' | 'wav' | 'ogg' | 'aac' | 'flac' | 'other' | null {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    if (path.endsWith('.mp3')) return 'mp3';
    if (path.endsWith('.wav')) return 'wav';
    if (path.endsWith('.ogg') || path.endsWith('.oga')) return 'ogg';
    if (path.endsWith('.aac')) return 'aac';
    if (path.endsWith('.flac')) return 'flac';
    return 'other';
  } catch { return null; }
}

async function renderAudio(payload: AudioFeatherPayload): Promise<string> {
  const escapeHtml = (text: string) =>
    text.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

  let html = '<div class="audio-container">';

  // Audio metadata header
  if (payload.title || payload.artist || payload.coverArt) {
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

  // Album/duration removed from minimal schema

    html += '</div></div>';
  }

  // Audio player
  const resolvedType = payload.audioType || detectAudioType(payload.audioUrl) || 'mp3';
  html += `<audio class="audio-player" controls`;

  html += `>`;
  html += `<source src="${escapeHtml(payload.audioUrl)}" type="audio/${resolvedType}">`;
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

  // Album/duration removed from minimal schema

  if (parts.length === 0) {
    const t = (payload.audioType || detectAudioType(payload.audioUrl) || 'mp3').toUpperCase();
    return `Audio (${t})`;
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
