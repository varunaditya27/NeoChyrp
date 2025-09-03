/** Highlighter Module
 * - Applies syntax highlighting to code blocks during markdown rendering.
 * - Strategy: integrate with Shiki or Highlight.js later.
 */
import { z } from 'zod';

import { registerModule } from '../../lib/modules/registry';

import type { ModuleInstance } from '../../lib/modules/registry';

const highlighterConfigSchema = z.object({
  theme: z.string().default('github-light'),
  languages: z.array(z.string()).default(['javascript', 'typescript', 'python', 'php', 'html', 'css']),
  showLineNumbers: z.boolean().default(true),
  showCopyButton: z.boolean().default(true)
});

const highlighterModule: ModuleInstance = {
  manifest: {
    slug: 'highlighter',
    name: 'Syntax Highlighter',
    version: '1.0.0',
    description: 'Provides syntax highlighting for code blocks',
    author: 'Chyrp Team',
    dependencies: [],
    config: {
      schema: highlighterConfigSchema,
      defaults: {
        theme: 'github-light',
        languages: ['javascript', 'typescript', 'python', 'php', 'html', 'css'],
        showLineNumbers: true,
        showCopyButton: true
      }
    }
  },

  config: {
    theme: 'github-light',
    languages: ['javascript', 'typescript', 'python', 'php', 'html', 'css'],
    showLineNumbers: true,
    showCopyButton: true
  },

  activate() {
    console.log('Highlighter module activated');
  },

  deactivate() {
    console.log('Highlighter module deactivated');
  }
};

// Register the module
registerModule(highlighterModule);
