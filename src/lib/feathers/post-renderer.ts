/**
 * Post Rendering Service
 * Handles rendering posts using the feather system
 */

import { featherRegistry } from './registry';

// Import all feathers to ensure they're registered
import '../../feathers/text';
import '../../feathers/photo';
import '../../feathers/quote';
import '../../feathers/link';
import '../../feathers/video';
import '../../feathers/audio';
import '../../feathers/uploader';

export interface PostData {
  id: string;
  feather: string;
  featherData?: any;
  body?: string | null;
  renderedBody?: string | null;
}

/**
 * Render a post using its feather
 */
export async function renderPost(post: PostData): Promise<string> {
  try {
    // If we have pre-rendered content, use it
    if (post.renderedBody) {
      return post.renderedBody;
    }

    // Get the feather type (normalize to lowercase for consistency)
    const featherSlug = post.feather.toLowerCase();

    // Get payload from featherData or fallback to body for text feather
    let payload = post.featherData;

    // For text feather, if no featherData, use body as markdown
    if (featherSlug === 'text' && !payload && post.body) {
      payload = {
        markdown: post.body,
        enableComments: true,
        allowRichFormatting: true,
      };
    }

    if (!payload) {
      console.warn(`No featherData or body found for post ${post.id} with feather ${post.feather}`);
      return `<div class="feather-error">
        <p><strong>Content Unavailable</strong></p>
        <p>This ${post.feather.toLowerCase()} post could not be rendered.</p>
      </div>`;
    }

    // Render using the feather
    const html = await featherRegistry.renderPost(featherSlug, payload);
    return html;
  } catch (error) {
    console.error('Error rendering post:', error);
    // Fallback to plain text rendering
    return `<div class="error-content">
      <p>Error rendering content. Raw content:</p>
      <pre>${post.body || 'No content available'}</pre>
    </div>`;
  }
}

/**
 * Generate excerpt for a post using its feather
 */
export function generatePostExcerpt(post: PostData): string {
  try {
    const featherSlug = post.feather.toLowerCase();

    let payload = post.featherData;

    // For text feather, if no featherData, use body as markdown
    if (featherSlug === 'text' && !payload && post.body) {
      payload = {
        markdown: post.body,
        enableComments: true,
        allowRichFormatting: true,
      };
    }

    if (!payload) {
      return 'No content available';
    }

    return featherRegistry.generateExcerpt(featherSlug, payload);
  } catch (error) {
    console.error('Error generating excerpt:', error);
    return post.body?.slice(0, 160) + '...' || 'No content available';
  }
}

/**
 * Get available feathers
 */
export function getAvailableFeathers() {
  return featherRegistry.listFeathers();
}

/**
 * Validate feather payload
 */
export function validateFeatherPayload(featherSlug: string, payload: unknown) {
  return featherRegistry.validatePayload(featherSlug.toLowerCase(), payload);
}
