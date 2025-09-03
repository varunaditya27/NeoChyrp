/**
 * Read More Module
 * ----------------
 * Generates excerpts from post content with customizable length limits.
 * Supports explicit excerpt markers (e.g., <!--more-->).
 */

import { z } from 'zod';

import { registerModule } from '../../lib/modules/registry';

export const readMoreService = {
  generateExcerpt(content: string, maxLength = 200): string {
    console.log('[ReadMore] Generating excerpt, max length:', maxLength);

    // Check for explicit excerpt marker
    const moreMarker = '<!--more-->';
    const markerIndex = content.indexOf(moreMarker);
    if (markerIndex !== -1) {
      return content.substring(0, markerIndex).trim();
    }

    // Auto-generate excerpt by truncating
    if (content.length <= maxLength) {
      return content;
    }

    // Find the last complete word within the limit
    const truncated = content.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    if (lastSpaceIndex > 0) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }

    return truncated + '...';
  },

  hasMoreContent(content: string, excerpt: string): boolean {
    return content.length > excerpt.length;
  },
};

// Register the module
registerModule({
  manifest: {
    slug: 'read_more',
    name: 'Read More',
    version: '1.0.0',
    description: 'Automatic excerpt generation with read more functionality',
    dependencies: [],
    config: {
      schema: z.object({
        defaultLength: z.number().default(200),
        respectMarkers: z.boolean().default(true),
        stripHtml: z.boolean().default(true),
      }),
      defaults: {
        defaultLength: 200,
        respectMarkers: true,
        stripHtml: true,
      },
    },
  },
  async activate() {
    console.log('[ReadMore] Module activated');
  },

  async deactivate() {
    console.log('[ReadMore] Module deactivated');
  },
});
