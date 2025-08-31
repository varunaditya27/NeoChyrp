/** Cascade (Infinite Scrolling) Module Placeholder
 * - Provides API pagination metadata + frontend helper script for intersection observer.
 * - Server side: consistent paging (cursor/offset) endpoints.
 */
import type { ModuleDescriptor } from '../index';

export function registerCascadeModule(): ModuleDescriptor {
  return { name: 'cascade', enabled: true };
}
