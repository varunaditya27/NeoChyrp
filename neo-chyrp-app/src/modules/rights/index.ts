/** Rights Module Placeholder
 * - Attaches attribution / licensing metadata to posts.
 * - Potential integration: per-post Creative Commons selection.
 */
import type { ModuleDescriptor } from '../index';

export function registerRightsModule(): ModuleDescriptor {
  return { name: 'rights', enabled: true };
}
