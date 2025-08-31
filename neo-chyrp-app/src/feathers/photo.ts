/** Photo Feather Placeholder
 * - Single image with optional caption + alt text.
 */
export interface PhotoFeatherInput { url: string; alt?: string; caption?: string }
export function renderPhotoFeather(input: PhotoFeatherInput) {
  return { html: `<figure><img src="${input.url}" alt="${input.alt || ''}" />${input.caption ? `<figcaption>${input.caption}</figcaption>` : ''}</figure>` };
}
