/** Lightbox Module Placeholder
 * - Provides client assets for image zoom/protection overlay.
 * - Could inject JS via a future asset pipeline or export a React provider.
 */
import type { ModuleDescriptor } from '../index';

export function registerLightboxModule(): ModuleDescriptor {
  return { name: 'lightbox', enabled: true };
}
