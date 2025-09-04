// Unified Markdown utilities for NeoChyrp
// Responsibilities:
// 1. Parse markdown to HTML (server & client compatible)
// 2. Sanitize HTML output to prevent XSS
// 3. Provide excerpt & plain‑text helpers
// 4. Central place to adjust markdown rendering options (extensions, GFM, etc.)

import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

// Configure marked once (can be extended later for custom extensions)
marked.setOptions({
	gfm: true,
	breaks: true,
});

export interface RenderMarkdownOptions {
	sanitize?: boolean; // default true
	excerptLength?: number; // only used by excerpt helper
}

/** Render raw markdown to (optionally sanitized) HTML string. */
export function renderMarkdown(markdown: string, opts: RenderMarkdownOptions = {}): string {
	const { sanitize = true } = opts;
	const html = marked.parse(markdown || '');
	if (!sanitize) return html as string;
	return DOMPurify.sanitize(html as string, {
		ALLOWED_TAGS: [
			'p','br','strong','em','u','s','code','pre','kbd','var','sup','sub','del',
			'h1','h2','h3','h4','h5','h6','ul','ol','li','blockquote','hr',
			'a','img','figure','figcaption','table','thead','tbody','tr','th','td'
		],
		ALLOWED_ATTR: ['href','src','alt','title','class','id','lang','dir'],
		// Basic URL protocol allow‑list (http, https, mailto, tel plus relative)
		ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
	});
}

/** Strip markdown formatting for plain‑text operations (e.g., excerpts, SEO). */
export function stripMarkdown(markdown: string): string {
	return (markdown || '')
		.replace(/```[\s\S]*?```/g, '') // remove fenced code blocks
		.replace(/`[^`]*`/g, '') // inline code
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
		.replace(/\[[^\]]*\]\([^)]*\)/g, '') // links
		.replace(/#{1,6}\s+/g, '') // headings
		.replace(/[*_~`>#-]/g, '') // markdown punctuation noise (rough)
		.replace(/\r?\n+/g, ' ')
		.trim();
}

/** Generate an excerpt from markdown (clean plain text, length‑bounded). */
export function excerptFromMarkdown(markdown: string, opts: RenderMarkdownOptions = {}): string {
	const { excerptLength = 160 } = opts;
	const plain = stripMarkdown(markdown);
	if (plain.length <= excerptLength) return plain;
	return plain.slice(0, excerptLength - 3).trimEnd() + '...';
}

/** Convenience composed result for API callers. */
export function compileMarkdown(markdown: string) {
	return {
		html: renderMarkdown(markdown),
		excerpt: excerptFromMarkdown(markdown)
	};
}

// Lightweight emoji pass (can be promoted into trigger pipeline later)
const emojiMap: Record<string,string> = { ':smile:':'😄', ':heart:':'❤️', ':thumbsup:':'👍' };
export function injectEmoji(html: string): string {
	return html.replace(/:(smile|heart|thumbsup):/g, m => emojiMap[m] || m);
}

// Future: support plugin registration (remark/rehype style) & caching.

const markdownUtil = {
	renderMarkdown,
	excerptFromMarkdown,
	stripMarkdown,
	compileMarkdown,
	injectEmoji,
};

export default markdownUtil;
