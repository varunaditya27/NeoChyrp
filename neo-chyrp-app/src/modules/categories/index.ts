/** Categories (Categorize) Module Placeholder
 * - Hierarchical taxonomy (parent/child) with optional nesting.
 * - Enforces slug uniqueness.
 */
import type { ModuleDescriptor } from '../index';

export function registerCategoriesModule(): ModuleDescriptor {
  return { name: 'categories', enabled: true };
}
