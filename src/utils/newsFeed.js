const NEWS_SOURCE_URL = '/content/news.md'

function parseFrontmatter(source) {
	return source.split('\n').reduce((acc, line) => {
		const separatorIndex = line.indexOf(':')
		if (separatorIndex === -1) {
			return acc
		}

		const key = line.slice(0, separatorIndex).trim()
		const value = line.slice(separatorIndex + 1).trim()
		acc[key] = value
		return acc
	}, {})
}

function parseLocalizedBody(body, locale) {
	const pattern = new RegExp(`::: ${locale}\\n([\\s\\S]*?)\\n:::`, 'm')
	const match = body.match(pattern)
	return match ? match[1].trim() : ''
}

function markdownToBlocks(markdown) {
	const blocks = []
	const lines = markdown.split('\n')
	let paragraph = []
	let listItems = []

	const flushParagraph = () => {
		if (paragraph.length) {
			blocks.push({
				type: 'paragraph',
				text: paragraph.join(' ').trim(),
			})
			paragraph = []
		}
	}

	const flushList = () => {
		if (listItems.length) {
			blocks.push({
				type: 'list',
				items: listItems,
			})
			listItems = []
		}
	}

	lines.forEach((line) => {
		const trimmed = line.trim()

		if (!trimmed) {
			flushParagraph()
			flushList()
			return
		}

		const heading = trimmed.match(/^(#{2,3})\s+(.+)$/)
		if (heading) {
			flushParagraph()
			flushList()
			blocks.push({
				type: heading[1].length === 2 ? 'heading' : 'subheading',
				text: heading[2].trim(),
			})
			return
		}

		const listItem = trimmed.match(/^[-*]\s+(.+)$/)
		if (listItem) {
			flushParagraph()
			listItems.push(listItem[1].trim())
			return
		}

		flushList()
		paragraph.push(trimmed)
	})

	flushParagraph()
	flushList()
	return blocks
}

export function parseNewsMarkdown(source) {
	const articles = []
	const articlePattern = /---\n([\s\S]*?)\n---\n([\s\S]*?)(?=\n---\n|$)/g
	let match

	while ((match = articlePattern.exec(source)) !== null) {
		const meta = parseFrontmatter(match[1])
		const id = meta.id?.trim()

		if (!id) {
			continue
		}

		const zhBody = parseLocalizedBody(match[2], 'zh')
		const enBody = parseLocalizedBody(match[2], 'en')

		articles.push({
			id,
			date: meta.date || '',
			image: meta.image || '',
			type: {
				zh: meta.type_zh || '',
				en: meta.type_en || meta.type_zh || '',
			},
			title: {
				zh: meta.title_zh || '',
				en: meta.title_en || meta.title_zh || '',
			},
			description: {
				zh: meta.description_zh || '',
				en: meta.description_en || meta.description_zh || '',
			},
			body: {
				zh: markdownToBlocks(zhBody),
				en: markdownToBlocks(enBody || zhBody),
			},
			to: meta.to || `/news/${id}`,
		})
	}

	return articles
}

export async function loadNewsFeed() {
	try {
		const response = await fetch(`${NEWS_SOURCE_URL}?t=${Date.now()}`, {
			cache: 'no-store',
		})

		if (!response.ok) {
			throw new Error(`Failed to load news markdown: ${response.status}`)
		}

		const markdown = await response.text()
		const news = parseNewsMarkdown(markdown)
		return news
	} catch (error) {
		console.error(error)
		return []
	}
}
