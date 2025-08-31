/** Easy Embed Module Placeholder
 * - Detects and transforms known provider URLs (YouTube, Twitter/X, etc.).
 * - Could leverage oEmbed endpoints or custom heuristics.
 */
import type { ModuleDescriptor } from '../index';

export function registerEasyEmbedModule(): ModuleDescriptor {
  return { name: 'easy_embed', enabled: true };
}
