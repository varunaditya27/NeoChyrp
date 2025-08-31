/** Video Feather Placeholder
 * - Local or external video embed.
 */
export interface VideoFeatherInput { videoUrl: string; posterUrl?: string }
export function renderVideoFeather(input: VideoFeatherInput) {
  return { html: `<video controls ${input.posterUrl ? `poster='${input.posterUrl}'` : ''}><source src='${input.videoUrl}' /></video>` };
}
