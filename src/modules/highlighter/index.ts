/** Highlighter Module Placeholder
 * - Applies syntax highlighting to code blocks during markdown rendering.
 * - Strategy: integrate with Shiki or Highlight.js later.
 */
import type { ModuleDescriptor } from '../index';

export function registerHighlighterModule(): ModuleDescriptor {
  return { name: 'highlighter', enabled: true };
}
