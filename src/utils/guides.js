import { guideItems } from '@/data/guides.js'

const GUIDE_SOURCE_BASE = '/content/guides'

function escapeHtml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;')
}

function sanitizeUrl(url) {
	const trimmed = url.trim()

	if (/^(https?:|mailto:|\/)/i.test(trimmed)) {
		return trimmed
	}

	return '#'
}

function normalizeGuideHref(href) {
	const cleanHref = href.trim()
	const localDoc = cleanHref.match(/^\/?([^/#?]+)\.md([#?].*)?$/)

	if (localDoc) {
		return `/guides/${localDoc[1]}${localDoc[2] || ''}`
	}

	return cleanHref
}

function renderInline(markdown) {
	let text = escapeHtml(markdown)

	text = text.replace(/!\[([^\]]*)]\(([^)]+)\)/g, (_, alt, url) => {
		const src = escapeHtml(sanitizeUrl(url))
		return `<img src="${src}" alt="${alt}" loading="lazy">`
	})

	text = text.replace(/\[([^\]]+)]\(([^)]+)\)/g, (_, label, url) => {
		const href = escapeHtml(sanitizeUrl(normalizeGuideHref(url)))
		return `<a href="${href}">${label}</a>`
	})

	text = text.replace(/`([^`]+)`/g, '<code>$1</code>')
	text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
	text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>')

	return text
}

function isTableSeparator(line) {
	return /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(line)
}

function splitTableRow(line) {
	return line
		.trim()
		.replace(/^\|/, '')
		.replace(/\|$/, '')
		.split('|')
		.map((cell) => cell.trim())
}

function renderTable(lines, startIndex) {
	const header = splitTableRow(lines[startIndex])
	const rows = []
	let index = startIndex + 2

	while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
		rows.push(splitTableRow(lines[index]))
		index += 1
	}

	const headHtml = header.map((cell) => `<th>${renderInline(cell)}</th>`).join('')
	const bodyHtml = rows
		.map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join('')}</tr>`)
		.join('')

	return {
		html: `<div class="guide-table-wrap"><table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`,
		nextIndex: index,
	}
}

export function markdownToGuideHtml(markdown) {
	const html = []
	const lines = markdown.replace(/\r\n/g, '\n').split('\n')
	let index = 0
	let paragraph = []
	let listItems = []
	let blockquote = []

	const flushParagraph = () => {
		if (paragraph.length) {
			html.push(`<p>${renderInline(paragraph.join(' ').trim())}</p>`)
			paragraph = []
		}
	}

	const flushList = () => {
		if (listItems.length) {
			html.push(`<ul>${listItems.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`)
			listItems = []
		}
	}

	const flushBlockquote = () => {
		if (blockquote.length) {
			html.push(`<blockquote>${blockquote.map((item) => `<p>${renderInline(item)}</p>`).join('')}</blockquote>`)
			blockquote = []
		}
	}

	while (index < lines.length) {
		const line = lines[index]
		const trimmed = line.trim()

		if (!trimmed) {
			flushParagraph()
			flushList()
			flushBlockquote()
			index += 1
			continue
		}

		if (trimmed.startsWith('```')) {
			flushParagraph()
			flushList()
			flushBlockquote()
			const code = []
			index += 1

			while (index < lines.length && !lines[index].trim().startsWith('```')) {
				code.push(lines[index])
				index += 1
			}

			html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`)
			index += 1
			continue
		}

		if (trimmed.includes('|') && lines[index + 1] && isTableSeparator(lines[index + 1])) {
			flushParagraph()
			flushList()
			flushBlockquote()
			const table = renderTable(lines, index)
			html.push(table.html)
			index = table.nextIndex
			continue
		}

		const heading = trimmed.match(/^(#{1,4})\s+(.+)$/)
		if (heading) {
			flushParagraph()
			flushList()
			flushBlockquote()
			const level = heading[1].length
			html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`)
			index += 1
			continue
		}

		const listItem = trimmed.match(/^[-*]\s+(.+)$/) || trimmed.match(/^\d+[.)]\s+(.+)$/)
		if (listItem) {
			flushParagraph()
			flushBlockquote()
			listItems.push(listItem[1])
			index += 1
			continue
		}

		if (trimmed.startsWith('>')) {
			flushParagraph()
			flushList()
			blockquote.push(trimmed.replace(/^>\s?/, ''))
			index += 1
			continue
		}

		flushList()
		flushBlockquote()
		paragraph.push(trimmed)
		index += 1
	}

	flushParagraph()
	flushList()
	flushBlockquote()

	return html.join('\n')
}

export async function loadGuideMarkdown(id) {
	const guide = guideItems.find((item) => item.id === id)

	if (!guide) {
		return null
	}

	try {
		const response = await fetch(`${GUIDE_SOURCE_BASE}/${guide.id}.md?t=${Date.now()}`, {
			cache: 'no-store',
		})

		if (!response.ok) {
			throw new Error(`Failed to load guide markdown: ${response.status}`)
		}

		const markdown = await response.text()

		return {
			...guide,
			html: markdownToGuideHtml(markdown),
		}
	} catch (error) {
		console.error(error)
		return null
	}
}
