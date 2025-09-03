/** Easy Embed Module
 * - Detects and transforms known provider URLs (YouTube, Twitter/X, etc.).
 * - Could leverage oEmbed endpoints or custom heuristics.
 */
import { z } from 'zod';

import { registerModule } from '../../lib/modules/registry';

import type { ModuleInstance } from '../../lib/modules/registry';

const easyEmbedConfigSchema = z.object({
  enabledProviders: z.array(z.string()).default(['youtube', 'twitter', 'vimeo']),
  maxWidth: z.number().default(560),
  maxHeight: z.number().default(315),
  autoPlay: z.boolean().default(false)
});

const easyEmbedModule: ModuleInstance = {
  manifest: {
    slug: 'easy_embed',
    name: 'Easy Embed',
    version: '1.0.0',
    description: 'Automatically converts URLs to embedded content',
    author: 'Chyrp Team',
    dependencies: [],
    config: {
      schema: easyEmbedConfigSchema,
      defaults: {
        enabledProviders: ['youtube', 'twitter', 'vimeo'],
        maxWidth: 560,
        maxHeight: 315,
        autoPlay: false
      }
    }
  },

  config: {
    enabledProviders: ['youtube', 'twitter', 'vimeo'],
    maxWidth: 560,
    maxHeight: 315,
    autoPlay: false
  },

  activate() {
    console.log('Easy Embed module activated');
  },

  deactivate() {
    console.log('Easy Embed module deactivated');
  }
};

// Register the module
registerModule(easyEmbedModule);
