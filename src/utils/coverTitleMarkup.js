const SUPPORTED_TAGS = new Set(['title', 'subtitle', 'solid', 'accent', 'newline'])
export const COVER_TITLE_FONT_FAMILY =
    '"Inter", "Noto Sans CJK SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif'
const ENTITY_VALUES = Object.freeze({
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
})

export class CoverTitleMarkupError extends SyntaxError {
    constructor(message, line, column) {
        super(message)
        this.name = 'CoverTitleMarkupError'
        this.line = line
        this.column = column
    }
}

function getPosition(source, offset) {
    let line = 1
    let column = 1
    for (let index = 0; index < offset; index += 1) {
        if (source[index] === '\r') {
            if (source[index + 1] === '\n') index += 1
            line += 1
            column = 1
        } else if (source[index] === '\n') {
            line += 1
            column = 1
        } else {
            column += 1
        }
    }
    return { line, column }
}

function isAsciiLetter(character) {
    return (character >= 'a' && character <= 'z') || (character >= 'A' && character <= 'Z')
}

function decodeText(source, start, end) {
    let value = ''
    let index = start
    while (index < end) {
        if (source[index] === '&') {
            let matchedEntity = null
            for (const entity of Object.keys(ENTITY_VALUES)) {
                if (source.startsWith(entity, index) && index + entity.length <= end) {
                    matchedEntity = entity
                    break
                }
            }
            if (matchedEntity) {
                value += ENTITY_VALUES[matchedEntity]
                index += matchedEntity.length
                continue
            }
        }
        value += source[index]
        index += 1
    }
    return value
}

function createTagToken(raw, source, offset) {
    const location = getPosition(source, offset)
    if (raw === '<newline/>') {
        return { type: 'newline', ...location }
    }

    let index = 1
    let closing = false
    if (raw[index] === '/') {
        closing = true
        index += 1
    }

    const nameStart = index
    while (isAsciiLetter(raw[index] || '')) index += 1
    const name = raw.slice(nameStart, index).toLowerCase()
    if (!name || raw[index] !== '>' || index !== raw.length - 1) {
        throw new CoverTitleMarkupError(
            `Invalid markup token: ${raw}`,
            location.line,
            location.column
        )
    }
    if (!SUPPORTED_TAGS.has(name)) {
        throw new CoverTitleMarkupError(
            `Unsupported tag: <${name}>`,
            location.line,
            location.column
        )
    }
    if (name === 'newline') {
        throw new CoverTitleMarkupError(
            '<newline/> must be self-closing',
            location.line,
            location.column
        )
    }
    if (!closing && raw[index - 1] === '/') {
        throw new CoverTitleMarkupError(
            `Only <newline/> may be self-closing`,
            location.line,
            location.column
        )
    }

    return {
        type: closing ? 'close' : 'open',
        name,
        ...location,
    }
}

export function tokenizeCoverTitleMarkup(source) {
    const tokens = []
    let textStart = 0
    let index = 0
    const input = String(source)

    const flushText = (end) => {
        if (end <= textStart) return
        const value = decodeText(input, textStart, end)
        if (value) {
            tokens.push({
                type: 'text',
                value,
                ...getPosition(input, textStart),
            })
        }
    }

    while (index < input.length) {
        if (input[index] !== '<') {
            index += 1
            continue
        }

        const nextCharacter = input[index + 1] || ''
        const isTagCandidate =
            nextCharacter === '/' ||
            isAsciiLetter(nextCharacter) ||
            nextCharacter === '!' ||
            nextCharacter === '?'
        if (!isTagCandidate) {
            index += 1
            continue
        }

        const closingIndex = input.indexOf('>', index + 1)
        if (closingIndex < 0) {
            const location = getPosition(input, index)
            throw new CoverTitleMarkupError(
                'Incomplete markup token',
                location.line,
                location.column
            )
        }

        flushText(index)
        const raw = input.slice(index, closingIndex + 1)
        tokens.push(createTagToken(raw, input, index))
        index = closingIndex + 1
        textStart = index
    }

    flushText(input.length)
    return tokens
}

export function parseCoverTitleMarkup(source) {
    const input = String(source)
    const root = { type: 'document', children: [] }
    const stack = [root]

    for (const token of tokenizeCoverTitleMarkup(input)) {
        const current = stack[stack.length - 1]
        if (token.type === 'text') {
            current.children.push({
                type: 'text',
                value: token.value,
                line: token.line,
                column: token.column,
            })
            continue
        }
        if (token.type === 'newline') {
            current.children.push({
                type: 'newline',
                line: token.line,
                column: token.column,
            })
            continue
        }
        if (token.type === 'open') {
            const element = {
                type: 'element',
                name: token.name,
                children: [],
                line: token.line,
                column: token.column,
            }
            current.children.push(element)
            stack.push(element)
            continue
        }

        if (stack.length === 1) {
            throw new CoverTitleMarkupError(
                `Unexpected closing tag: </${token.name}>`,
                token.line,
                token.column
            )
        }
        if (current.name !== token.name) {
            throw new CoverTitleMarkupError(
                `Expected </${current.name}>, got </${token.name}>`,
                token.line,
                token.column
            )
        }
        stack.pop()
    }

    if (stack.length > 1) {
        const unclosed = stack[stack.length - 1]
        const location = getPosition(input, input.length)
        throw new CoverTitleMarkupError(
            `Unclosed tag: <${unclosed.name}>`,
            location.line,
            location.column
        )
    }

    return root
}

function normalizeText(value) {
    return value.replace(/\s+/gu, ' ')
}

function trimBoundaryWhitespace(runs) {
    const result = runs.map((run) => ({ ...run }))
    const first = result.find((run) => run.type === 'text')
    if (first) first.value = first.value.replace(/^\s+/u, '')
    let last = null
    for (let index = result.length - 1; index >= 0; index -= 1) {
        if (result[index].type === 'text') {
            last = result[index]
            break
        }
    }
    if (last) last.value = last.value.replace(/\s+$/u, '')
    return result.filter((run) => run.type !== 'text' || run.value)
}

export function resolveCoverTitleRuns(document) {
    const runs = []
    let nextSolidId = 1
    let nextAccentId = 1

    const flatten = (nodes, inheritedStyle, output) => {
        for (const node of nodes) {
            if (node.type === 'text') {
                const value = normalizeText(node.value)
                if (value) {
                    output.push({
                        type: 'text',
                        value,
                        style: inheritedStyle,
                        line: node.line,
                        column: node.column,
                    })
                }
                continue
            }
            if (node.type === 'newline') {
                if (inheritedStyle.paint.solidId !== null) {
                    throw new CoverTitleMarkupError(
                        '<solid> cannot span multiple lines',
                        node.line,
                        node.column
                    )
                }
                output.push(node)
                continue
            }

            const style = {
                typography: { ...inheritedStyle.typography },
                paint: { ...inheritedStyle.paint },
            }
            if (node.name === 'title') {
                style.typography.sizeScale = 1
                style.typography.fontWeight = 570
            } else if (node.name === 'subtitle') {
                style.typography.sizeScale = 0.7
                style.typography.fontWeight = 500
            } else if (node.name === 'solid') {
                if (style.paint.solidId === null) {
                    style.paint.solid = true
                    style.paint.background = 'theme.solidSurface'
                    style.paint.paddingX = 0.35
                    style.paint.paddingY = 0.22
                    style.paint.radius = 1
                    style.paint.solidId = nextSolidId++
                }
            } else if (node.name === 'accent') {
                if (style.paint.accentId === null) {
                    style.paint.accent = true
                    style.paint.gradient = 'theme.accentGradient'
                    style.paint.accentId = nextAccentId++
                }
            }

            const children = []
            flatten(node.children, style, children)
            output.push(
                ...(node.name === 'title' || node.name === 'subtitle'
                    ? trimBoundaryWhitespace(children)
                    : children)
            )
        }
    }

    flatten(
        document.children,
        {
            typography: {
                fontFamily: COVER_TITLE_FONT_FAMILY,
                sizeScale: 1,
                fontWeight: 550,
                lineHeight: 1.18,
                letterSpacing: 0,
            },
            paint: {
                foreground: null,
                background: null,
                gradient: null,
                paddingX: 0,
                paddingY: 0,
                radius: 0,
                solid: false,
                accent: false,
                solidId: null,
                accentId: null,
            },
        },
        runs
    )
    return runs
}

export function formatCoverTitleMarkupError(error) {
    if (!(error instanceof CoverTitleMarkupError)) return String(error)
    return `Line ${error.line}, column ${error.column}: ${error.message}`
}
