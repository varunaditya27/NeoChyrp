/** Quote Feather Placeholder
 * - Quotation block with optional citation.
 */
export interface QuoteFeatherInput { quote: string; source?: string; sourceUrl?: string }
export function renderQuoteFeather(input: QuoteFeatherInput) {
  const cite = input.source ? `<cite>${input.source}${input.sourceUrl ? ` – <a href="${input.sourceUrl}">link</a>` : ''}</cite>` : '';
  return { html: `<blockquote><p>${input.quote}</p>${cite}</blockquote>` };
}
