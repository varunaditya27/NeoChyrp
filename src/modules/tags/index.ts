/** Tags Module Placeholder
 * - Manages many-to-many relationship between posts and tags.
 * - Provides search/filtering by tag.
 * - Potential future features: tag synonyms, trending tags.
 */
import type { ModuleDescriptor } from '../index';

export function registerTagsModule(): ModuleDescriptor {
  return { name: 'tags', enabled: true };
}
