/** Lightbox Module
 * - Provides client assets for image zoom/protection overlay.
 * - Could inject JS via a future asset pipeline or export a React provider.
 */
import { z } from 'zod';

import { registerModule } from '../../lib/modules/registry';

import type { ModuleInstance } from '../../lib/modules/registry';

const lightboxConfigSchema = z.object({
  enableZoom: z.boolean().default(true),
  enableProtection: z.boolean().default(false),
  animationDuration: z.number().default(300),
  showImageInfo: z.boolean().default(true),
  enableKeyboardNavigation: z.boolean().default(true)
});

const lightboxModule: ModuleInstance = {
  manifest: {
    slug: 'lightbox',
    name: 'Lightbox',
    version: '1.0.0',
    description: 'Provides image lightbox functionality',
    author: 'Chyrp Team',
    dependencies: [],
    config: {
      schema: lightboxConfigSchema,
      defaults: {
        enableZoom: true,
        enableProtection: false,
        animationDuration: 300,
        showImageInfo: true,
        enableKeyboardNavigation: true
      }
    }
  },

  config: {
    enableZoom: true,
    enableProtection: false,
    animationDuration: 300,
    showImageInfo: true,
    enableKeyboardNavigation: true
  },

  activate() {
    console.log('Lightbox module activated');
  },

  deactivate() {
    console.log('Lightbox module deactivated');
  }
};

// Register the module
registerModule(lightboxModule);
