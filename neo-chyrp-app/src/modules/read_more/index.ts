/** Read More Module Placeholder
 * - Generates excerpt from post body (markdown -> plain text, length limit).
 * - Optionally respects explicit marker (e.g., <!--more-->).
 */
import type { ModuleDescriptor } from '../index';

export function registerReadMoreModule(): ModuleDescriptor {
  return { name: 'read_more', enabled: true };
}
