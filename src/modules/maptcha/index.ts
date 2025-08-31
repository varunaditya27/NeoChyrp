/** MAPTCHA (Math Captcha) Module Placeholder
 * - Generates simple arithmetic challenges for anonymous comment submissions.
 * - Stores hashed answer in ephemeral store (could be cookie-signed token).
 */
import type { ModuleDescriptor } from '../index';

export function registerMaptchaModule(): ModuleDescriptor {
  return { name: 'maptcha', enabled: true };
}
