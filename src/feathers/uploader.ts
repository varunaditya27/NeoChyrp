/**
 * Uploader Feather - File attachments and galleries
 * For uploading and displaying multiple files and documents
 */

import { z } from 'zod';

import { registerFeather, type FeatherRenderer, type FeatherExcerptGenerator } from '../lib/feathers/registry';

// Schema for individual file
const FileSchema = z.object({
  url: z.string().url('Must be a valid file URL'),
  name: z.string().min(1, 'File name is required'),
  size: z.number().min(0, 'File size must be positive'),
  type: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().url().optional().or(z.literal('')),
});

// Schema for uploader feather payload
export const UploaderFeatherSchema = z.object({
  files: z.array(FileSchema).min(1, 'At least one file is required'),
  description: z.string().optional(),
  layout: z.enum(['list', 'grid', 'gallery']).default('list'),
  showThumbnails: z.boolean().default(true),
  showFileInfo: z.boolean().default(true),
  allowDownload: z.boolean().default(true),
});

export type UploaderFeatherPayload = z.infer<typeof UploaderFeatherSchema>;
export type FileItem = z.infer<typeof FileSchema>;

// Field definitions for admin UI
const uploaderFields = [
  {
    name: 'files',
    type: 'file-list' as const,
    label: 'Files',
    required: true,
    multiple: true,
  },
  {
    name: 'description',
    type: 'textarea' as const,
    label: 'Description',
    required: false,
    placeholder: 'Brief description of the files or gallery',
  },
  {
    name: 'layout',
    type: 'select' as const,
    label: 'Layout',
    required: false,
    options: [
      { value: 'list', label: 'List' },
      { value: 'grid', label: 'Grid' },
      { value: 'gallery', label: 'Gallery' },
    ],
  },
  {
    name: 'showThumbnails',
    type: 'checkbox' as const,
    label: 'Show Thumbnails',
    required: false,
  },
  {
    name: 'showFileInfo',
    type: 'checkbox' as const,
    label: 'Show File Info',
    required: false,
  },
  {
    name: 'allowDownload',
    type: 'checkbox' as const,
    label: 'Allow Download',
    required: false,
  },
];

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Helper function to determine if file is an image
function isImage(file: FileItem): boolean {
  if (!file.type) return false;
  return file.type.startsWith('image/') ||
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
}

// Helper function to get file icon class
function getFileIcon(file: FileItem): string {
  if (!file.type) return 'file';

  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.includes('pdf')) return 'pdf';
  if (file.type.includes('word') || file.type.includes('document')) return 'document';
  if (file.type.includes('spreadsheet') || file.type.includes('excel')) return 'spreadsheet';
  if (file.type.includes('presentation') || file.type.includes('powerpoint')) return 'presentation';
  if (file.type.includes('zip') || file.type.includes('rar') || file.type.includes('7z')) return 'archive';

  return 'file';
}

// Render function
async function renderUploader(payload: UploaderFeatherPayload): Promise<string> {
  const escapeHtml = (text: string) =>
    text.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

  let html = `<div class="uploader-container uploader-${payload.layout}">`;

  if (payload.description) {
    html += `<p class="uploader-description">${escapeHtml(payload.description)}</p>`;
  }

  if (payload.layout === 'gallery') {
    // Gallery layout for images
    const imageFiles = payload.files.filter(isImage);
    const otherFiles = payload.files.filter(f => !isImage(f));

    if (imageFiles.length > 0) {
      html += `<div class="uploader-gallery">`;

      for (const file of imageFiles) {
        html += `<div class="gallery-item">`;

        const imgSrc = file.thumbnail || file.url;
        html += `<a href="${escapeHtml(file.url)}" class="gallery-link" data-lightbox="gallery">`;
        html += `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(file.description || file.name)}" loading="lazy">`;
        html += `</a>`;

        if (payload.showFileInfo && (file.description || file.name)) {
          html += `<div class="gallery-caption">`;
          html += `<span class="file-name">${escapeHtml(file.description || file.name)}</span>`;
          html += `</div>`;
        }

        html += `</div>`;
      }

      html += `</div>`;
    }

    // List remaining non-image files
    if (otherFiles.length > 0) {
      html += `<div class="uploader-files">`;
      html += `<h4>Attachments</h4>`;
      html += renderFileList(otherFiles, payload, escapeHtml);
      html += `</div>`;
    }
  } else if (payload.layout === 'grid') {
    // Grid layout
    html += `<div class="uploader-grid">`;

    for (const file of payload.files) {
      html += `<div class="grid-item">`;

      if (payload.showThumbnails && (file.thumbnail || isImage(file))) {
        const imgSrc = file.thumbnail || (isImage(file) ? file.url : '');
        if (imgSrc) {
          html += `<div class="grid-thumbnail">`;
          if (payload.allowDownload) {
            html += `<a href="${escapeHtml(file.url)}" target="_blank">`;
          }
          html += `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(file.name)}" loading="lazy">`;
          if (payload.allowDownload) {
            html += `</a>`;
          }
          html += `</div>`;
        }
      } else {
        html += `<div class="grid-icon file-icon-${getFileIcon(file)}"></div>`;
      }

      html += `<div class="grid-info">`;

      if (payload.allowDownload) {
        html += `<a href="${escapeHtml(file.url)}" class="file-link" target="_blank">${escapeHtml(file.name)}</a>`;
      } else {
        html += `<span class="file-name">${escapeHtml(file.name)}</span>`;
      }

      if (payload.showFileInfo) {
        html += `<div class="file-meta">`;
        html += `<span class="file-size">${formatFileSize(file.size)}</span>`;
        if (file.type) {
          html += ` • <span class="file-type">${escapeHtml(file.type)}</span>`;
        }
        html += `</div>`;

        if (file.description) {
          html += `<p class="file-description">${escapeHtml(file.description)}</p>`;
        }
      }

      html += `</div></div>`;
    }

    html += `</div>`;
  } else {
    // List layout (default)
    html += renderFileList(payload.files, payload, escapeHtml);
  }

  html += `</div>`;

  return html;
}

// Helper function to render file list
function renderFileList(files: FileItem[], payload: UploaderFeatherPayload, escapeHtml: (text: string) => string): string {
  let html = `<ul class="uploader-list">`;

  for (const file of files) {
    html += `<li class="file-item">`;

    if (payload.showThumbnails && (file.thumbnail || isImage(file))) {
      const imgSrc = file.thumbnail || (isImage(file) ? file.url : '');
      if (imgSrc) {
        html += `<div class="file-thumbnail">`;
        if (payload.allowDownload) {
          html += `<a href="${escapeHtml(file.url)}" target="_blank">`;
        }
        html += `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(file.name)}" loading="lazy">`;
        if (payload.allowDownload) {
          html += `</a>`;
        }
        html += `</div>`;
      }
    } else {
      html += `<div class="file-icon file-icon-${getFileIcon(file)}"></div>`;
    }

    html += `<div class="file-info">`;

    if (payload.allowDownload) {
      html += `<a href="${escapeHtml(file.url)}" class="file-link" target="_blank">${escapeHtml(file.name)}</a>`;
    } else {
      html += `<span class="file-name">${escapeHtml(file.name)}</span>`;
    }

    if (payload.showFileInfo) {
      html += `<div class="file-meta">`;
      html += `<span class="file-size">${formatFileSize(file.size)}</span>`;
      if (file.type) {
        html += ` • <span class="file-type">${escapeHtml(file.type)}</span>`;
      }
      html += `</div>`;

      if (file.description) {
        html += `<p class="file-description">${escapeHtml(file.description)}</p>`;
      }
    }

    html += `</div></li>`;
  }

  html += `</ul>`;

  return html;
}

// Generate excerpt from uploader
function generateUploaderExcerpt(payload: UploaderFeatherPayload): string {
  const fileCount = payload.files.length;
  const totalSize = payload.files.reduce((sum, file) => sum + file.size, 0);

  let excerpt = `${fileCount} file${fileCount !== 1 ? 's' : ''} (${formatFileSize(totalSize)})`;

  if (payload.description) {
    const description = payload.description.length > 80
      ? payload.description.slice(0, 77).trim() + '...'
      : payload.description;
    excerpt = `${excerpt} — ${description}`;
  } else if (fileCount <= 3) {
    // List file names if few files and no description
    const names = payload.files.map(f => f.name).slice(0, 3).join(', ');
    excerpt = `${excerpt}: ${names}`;
  }

  return excerpt;
}

// Register the feather
registerFeather(
  {
    slug: 'uploader',
    name: 'Uploader',
    version: '1.0.0',
    description: 'File attachments, galleries, and document management',
    schema: UploaderFeatherSchema,
    fields: uploaderFields,
  },
  renderUploader as FeatherRenderer,
  generateUploaderExcerpt as FeatherExcerptGenerator
);

export { UploaderFeatherSchema as schema, renderUploader as render, generateUploaderExcerpt as excerpt };
