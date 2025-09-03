/** MAPTCHA (Math Captcha) Module
 * - Generates simple arithmetic challenges for anonymous comment submissions.
 * - Stores hashed answer in ephemeral store (could be cookie-signed token).
 */
import { z } from 'zod';

import { registerModule } from '../../lib/modules/registry';

import type { ModuleInstance } from '../../lib/modules/registry';

const maptchaConfigSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
  operations: z.array(z.enum(['add', 'subtract', 'multiply'])).default(['add', 'subtract']),
  maxNumber: z.number().default(20),
  sessionTimeout: z.number().default(300), // 5 minutes in seconds
});

const maptchaModule: ModuleInstance = {
  manifest: {
    slug: 'maptcha',
    name: 'Math CAPTCHA',
    version: '1.0.0',
    description: 'Simple arithmetic challenges for spam prevention',
    author: 'Chyrp Team',
    dependencies: [],
    config: {
      schema: maptchaConfigSchema,
      defaults: {
        difficulty: 'easy',
        operations: ['add', 'subtract'],
        maxNumber: 20,
        sessionTimeout: 300
      }
    }
  },

  config: {
    difficulty: 'easy',
    operations: ['add', 'subtract'],
    maxNumber: 20,
    sessionTimeout: 300
  },

  activate() {
    console.log('MAPTCHA module activated');
  },

  deactivate() {
    console.log('MAPTCHA module deactivated');
  }
};

// Register the module
registerModule(maptchaModule);
