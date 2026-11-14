import DOMPurify from 'dompurify'
import { marked } from 'marked'

/**
 * Demotes HTML heading tags h1..h5 down one level when a document contains an h1,
 * preventing nested article markup from duplicating the page's primary h1 landmark.
 */
export function demoteNestedHeadings(html) {
	if (!/<h1[\s>]/i.test(html)) {
		return html
	}
	return html.replace(/<(\/?)h([1-5])(?=[\s>])/gi, (_, slash, level) => `<${slash}h${Number(level) + 1}`)
}

/**
 * Parses and sanitizes untrusted/static markdown into safe HTML with optional heading demotion.
 */
export function renderSafeMarkdownHtml(markdown, { demoteHeadings = true } = {}) {
	const cleanHtml = DOMPurify.sanitize(marked.parse(markdown))
	return demoteHeadings ? demoteNestedHeadings(cleanHtml) : cleanHtml
}
