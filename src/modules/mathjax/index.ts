/** MathJax Module
 * - Renders LaTeX / MathML expressions within posts.
 * - Potential optimization: server-side pre-render cache of math spans.
 */
import { z } from 'zod';

import { registerModule } from '../../lib/modules/registry';

import type { ModuleInstance } from '../../lib/modules/registry';

const mathjaxConfigSchema = z.object({
  enableInline: z.boolean().default(true),
  enableDisplay: z.boolean().default(true),
  inlineDelimiters: z.array(z.tuple([z.string(), z.string()])).default([['$', '$'], ['\\(', '\\)']]),
  displayDelimiters: z.array(z.tuple([z.string(), z.string()])).default([['$$', '$$'], ['\\[', '\\]']]),
  processEscapes: z.boolean().default(true),
});

const mathjaxModule: ModuleInstance = {
  manifest: {
    slug: 'mathjax',
    name: 'MathJax',
    version: '1.0.0',
    description: 'Renders mathematical expressions in posts',
    author: 'Chyrp Team',
    dependencies: [],
    config: {
      schema: mathjaxConfigSchema,
      defaults: {
        enableInline: true,
        enableDisplay: true,
        inlineDelimiters: [['$', '$'], ['\\(', '\\)']],
        displayDelimiters: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true
      }
    }
  },

  config: {
    enableInline: true,
    enableDisplay: true,
    inlineDelimiters: [['$', '$'], ['\\(', '\\)']],
    displayDelimiters: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true
  },

  activate() {
    console.log('MathJax module activated');
  },

  deactivate() {
    console.log('MathJax module deactivated');
  }
};

// Register the module
registerModule(mathjaxModule);
