/** Audio Feather Placeholder
 * - Audio file playback.
 */
export interface AudioFeatherInput { audioUrl: string; title?: string }
export function renderAudioFeather(input: AudioFeatherInput) {
  return { html: `<figure><audio controls src='${input.audioUrl}'></audio>${input.title ? `<figcaption>${input.title}</figcaption>` : ''}</figure>` };
}
