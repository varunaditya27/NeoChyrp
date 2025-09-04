// Unified Markdown utilities for NeoChyrp
// Responsibilities:
// 1. Parse markdown to HTML (server & client compatible)
// 2. Sanitize HTML output to prevent XSS
// 3. Provide excerpt & plain‑text helpers
// 4. Central place to adjust markdown rendering options (extensions, GFM, etc.)

import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

// Optional runtime highlight (server-side) using highlight.js if available
let hl: any = null;
try { // eslint-disable-next-line @typescript-eslint/no-var-requires
	hl = require('highlight.js');
} catch { /* highlight.js not installed – graceful degrade */ }

// Configure marked highlighting if highlight.js present
if (hl) {
	marked.setOptions({
		// @ts-expect-error highlight.js signature mismatch for marked
		highlight(code: string, lang: string) {
			if (lang && hl.getLanguage(lang)) {
				try { return hl.highlight(code, { language: lang }).value; } catch { /* noop */ }
			}
			try { return hl.highlightAuto(code).value; } catch { return code; }
		}
	});
}

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
	const raw = markdown || '';
	const parsed = marked.parse(raw) as string;
	const transformed = transformEmbeds(parsed);
	if (!sanitize) return transformed;
		return DOMPurify.sanitize(transformed, {
		ALLOWED_TAGS: [
			'p','br','strong','em','u','s','code','pre','kbd','var','sup','sub','del',
			'h1','h2','h3','h4','h5','h6','ul','ol','li','blockquote','hr',
			'a','img','figure','figcaption','table','thead','tbody','tr','th','td',
			'iframe' // embed support
		],
			ALLOWED_ATTR: ['href','src','alt','title','class','id','lang','dir','frameborder','allow','allowfullscreen','loading','referrerpolicy','data-language'],
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

// --- Embed Transformation (Easy Embed Module helper) ---
// Replace standalone provider URLs with responsive iframe wrappers.
// NOTE: Kept intentionally small; richer provider catalog can be data-driven later.
function transformEmbeds(html: string): string {
	if (!html) return html;
	// Match either raw URL in <p> or anchor-only variant produced by marked
		return html.replace(/<p>(?:<a href="(https?:\/\/[^"<\s]+)"[^>]*>\1<\/a>|(https?:\/\/[^<\s]+))<\/p>/g, (m, aUrl, bUrl) => {
		const url = aUrl || bUrl;
		try {
			const u = new URL(url);
			// YouTube (watch or youtu.be)
			if (/^(www\.)?youtube\.com$/.test(u.hostname) && u.searchParams.get('v')) {
				const id = u.searchParams.get('v');
				return embedIframe(`https://www.youtube.com/embed/${id}`);
			}
			if (/^(youtu\.be)$/.test(u.hostname) && u.pathname.length > 1) {
				const id = u.pathname.slice(1);
				return embedIframe(`https://www.youtube.com/embed/${id}`);
			}
			// Vimeo numeric id
			if (/vimeo\.com$/.test(u.hostname) && /\/(\d+)/.test(u.pathname)) {
				const id = u.pathname.match(/\/(\d+)/)![1];
				return embedIframe(`https://player.vimeo.com/video/${id}`);
			}
			// Twitter (X) simple blockquote fallback (no script injection)
			if (/(^|\.)twitter\.com$/.test(u.hostname)) {
			return `<blockquote class="tweet-embed"><a href="${url}">${url}</a></blockquote>`;
			}
			return m; // unchanged if no supported provider
		} catch { return m; }
	});
}

function embedIframe(src: string): string {
	return `<div class="embed-wrapper aspect-video"><iframe src="${src}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen frameborder="0"></iframe></div>`;
}

export default markdownUtil;
