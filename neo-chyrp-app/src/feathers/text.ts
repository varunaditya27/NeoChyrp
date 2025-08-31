/** Text Feather Placeholder
 * - Represents a standard textual/markdown post.
 * - Future: include markdown -> HTML pipeline, sanitization, excerpt generation.
 */
export interface TextFeatherInput { markdown: string; }
export function renderTextFeather(_input: TextFeatherInput) {
  // TODO: Markdown parse + sanitize
  return { html: '<p><!-- rendered markdown placeholder --></p>' };
}
