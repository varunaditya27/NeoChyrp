/** Uploader Feather Placeholder
 * - Multi-file gallery / attachment list.
 */
export interface UploaderFeatherInput { files: Array<{ url: string; name: string; size: number }>; description?: string }
export function renderUploaderFeather(input: UploaderFeatherInput) {
  const items = input.files.map(f => `<li><a href='${f.url}'>${f.name}</a> <small>${f.size} bytes</small></li>`).join('');
  return { html: `<div>${input.description ? `<p>${input.description}</p>` : ''}<ul>${items}</ul></div>` };
}
