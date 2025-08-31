/** MathJax Module Placeholder
 * - Renders LaTeX / MathML expressions within posts.
 * - Potential optimization: server-side pre-render cache of math spans.
 */
import type { ModuleDescriptor } from '../index';

export function registerMathJaxModule(): ModuleDescriptor {
  return { name: 'mathjax', enabled: true };
}
