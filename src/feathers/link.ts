/** Link Feather Placeholder
 * - Outbound link with optional rich preview (future: fetch OpenGraph metadata).
 */
export interface LinkFeatherInput { url: string; title?: string; description?: string }
export function renderLinkFeather(input: LinkFeatherInput) {
  return { html: `<p><a href="${input.url}" target="_blank" rel="noopener noreferrer">${input.title || input.url}</a></p>` };
}
