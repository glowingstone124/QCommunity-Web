import assert from 'node:assert/strict'
import test from 'node:test'

import { generateCoverBackground } from './coverGenerator.js'
import { COVER_TITLE_THEMES, drawCoverTitle, layoutCoverTitle } from './coverTitle.js'
import {
    CoverTitleMarkupError,
    parseCoverTitleMarkup,
    resolveCoverTitleRuns,
    tokenizeCoverTitleMarkup,
} from './coverTitleMarkup.js'

if (!globalThis.ImageData) {
    globalThis.ImageData = class ImageData {
        constructor(data, width, height) {
            this.data = data
            this.width = width
            this.height = height
        }
    }
}

function createContext() {
    const context = {
        font: '',
        fillStyle: '',
        shadowColor: '',
        shadowBlur: 0,
        shadowOffsetY: 0,
        textAlign: '',
        textBaseline: '',
        events: [],
        save() {},
        restore() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        arcTo() {},
        closePath() {},
        createLinearGradient(x0, y0, x1, y1) {
            return {
                x0,
                y0,
                x1,
                y1,
                stops: [],
                addColorStop(offset, color) {
                    this.stops.push({ offset, color })
                },
            }
        },
        fill() {
            this.events.push({ type: 'background', color: this.fillStyle })
        },
        fillText(text, x, y) {
            this.events.push({
                type: 'text',
                text,
                x,
                y,
                color: this.fillStyle,
                font: this.font,
                letterSpacing: this.letterSpacing,
            })
        },
        measureText(text) {
            const fontSize = Number(/(\d+(?:\.\d+)?)px/.exec(this.font)?.[1] || 16)
            const width = Array.from(text).reduce(
                (total, character) =>
                    total +
                    fontSize *
                        (/\s/u.test(character) ? 0.32 : character.charCodeAt(0) > 255 ? 1 : 0.56),
                0
            )
            const glyphMetrics = {
                A: [0.56, 0.02],
                B: [0.68, 0.19],
                C: [0.61, 0.02],
                Hg: [0.78, 0.22],
                Ill: [0.4, 0.02],
                Wgy: [0.74, 0.2],
            }[text] || [0.61, 0.07]
            return {
                width,
                fontBoundingBoxAscent: fontSize * 0.82,
                fontBoundingBoxDescent: fontSize * 0.25,
                actualBoundingBoxAscent: fontSize * glyphMetrics[0],
                actualBoundingBoxDescent: fontSize * glyphMetrics[1],
            }
        },
    }
    return context
}

function createImageData(width, height, color = 128) {
    const data = new Uint8ClampedArray(width * height * 4)
    for (let offset = 0; offset < data.length; offset += 4) {
        data[offset] = color
        data[offset + 1] = color
        data[offset + 2] = color
        data[offset + 3] = 255
    }
    return { data, width, height }
}

function relativeLuminance(hex) {
    const channels = [1, 3, 5].map(
        (index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255
    )
    return relativeLuminanceFromChannels(channels.map((channel) => channel * 255))
}

function relativeLuminanceFromChannels(channels) {
    const linearChannels = channels.map((value) => {
        const channel = value / 255
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * linearChannels[0] + 0.7152 * linearChannels[1] + 0.0722 * linearChannels[2]
}

function contrastRatio(first, second) {
    const firstLuminance = relativeLuminance(first)
    const secondLuminance = relativeLuminance(second)
    return (
        (Math.max(firstLuminance, secondLuminance) + 0.05) /
        (Math.min(firstLuminance, secondLuminance) + 0.05)
    )
}

function oklchHue(hex) {
    const [red, green, blue] = [1, 3, 5].map((index) => {
        const channel = Number.parseInt(hex.slice(index, index + 2), 16) / 255
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    })
    const lightRoot = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue)
    const middleRoot = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue)
    const blueRoot = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue)
    const labA = 1.9779984951 * lightRoot - 2.428592205 * middleRoot + 0.4505937099 * blueRoot
    const labB = 0.0259040371 * lightRoot + 0.7827717662 * middleRoot - 0.808675766 * blueRoot
    return (Math.atan2(labB, labA) / (Math.PI * 2) + 1) % 1
}

function hueDistance(first, second) {
    const distance = Math.abs(first - second)
    return Math.min(distance, 1 - distance)
}

function blockContrastPercentile(imageData, layout, foreground, percentile = 0.15) {
    const padding = layout.fontSize * 0.15
    const left = Math.max(0, Math.floor(layout.textRect.left - padding))
    const top = Math.max(0, Math.floor(layout.textRect.top - padding))
    const right = Math.min(
        imageData.width,
        Math.ceil(layout.textRect.left + layout.textRect.width + padding)
    )
    const bottom = Math.min(
        imageData.height,
        Math.ceil(layout.textRect.top + layout.textRect.height + padding)
    )
    const rows = 7
    const columns = 7
    const samples = []
    for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
            const x = Math.max(
                0,
                Math.min(
                    imageData.width - 1,
                    Math.floor(left + ((column + 0.5) * (right - left)) / columns)
                )
            )
            const y = Math.max(
                0,
                Math.min(
                    imageData.height - 1,
                    Math.floor(top + ((row + 0.5) * (bottom - top)) / rows)
                )
            )
            const channels = [0, 0, 0]
            let count = 0
            for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
                for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
                    const sampleX = Math.max(0, Math.min(imageData.width - 1, x + offsetX))
                    const sampleY = Math.max(0, Math.min(imageData.height - 1, y + offsetY))
                    const offset = (sampleY * imageData.width + sampleX) * 4
                    channels[0] += imageData.data[offset]
                    channels[1] += imageData.data[offset + 1]
                    channels[2] += imageData.data[offset + 2]
                    count += 1
                }
            }
            const backgroundLuminance = relativeLuminanceFromChannels(
                channels.map((channel) => channel / count)
            )
            const foregroundLuminance = relativeLuminance(foreground)
            samples.push(
                (Math.max(backgroundLuminance, foregroundLuminance) + 0.05) /
                    (Math.min(backgroundLuminance, foregroundLuminance) + 0.05)
            )
        }
    }
    samples.sort((first, second) => first - second)
    const position = (samples.length - 1) * percentile
    const lowerIndex = Math.floor(position)
    const upperIndex = Math.ceil(position)
    return (
        samples[lowerIndex] + (samples[upperIndex] - samples[lowerIndex]) * (position - lowerIndex)
    )
}

test('plain text remains a title without requiring markup', () => {
    const document = parseCoverTitleMarkup('Hello World')
    const runs = resolveCoverTitleRuns(document)
    assert.equal(document.children[0].type, 'text')
    assert.equal(runs[0].value, 'Hello World')
    assert.equal(runs[0].style.typography.sizeScale, 1)
    assert.equal(runs[0].style.typography.fontWeight, 550)
    assert.equal(runs[0].style.paint.foreground, null)
})

test('tokenizer and stack parser create the expected nested AST', () => {
    const source = '<title>Hello <solid>World</solid></title>'
    assert.deepEqual(
        tokenizeCoverTitleMarkup(source).map(({ type, name, value }) => ({ type, name, value })),
        [
            { type: 'open', name: 'title', value: undefined },
            { type: 'text', name: undefined, value: 'Hello ' },
            { type: 'open', name: 'solid', value: undefined },
            { type: 'text', name: undefined, value: 'World' },
            { type: 'close', name: 'solid', value: undefined },
            { type: 'close', name: 'title', value: undefined },
        ]
    )
    assert.deepEqual(parseCoverTitleMarkup(source), {
        type: 'document',
        children: [
            {
                type: 'element',
                name: 'title',
                line: 1,
                column: 1,
                children: [
                    { type: 'text', value: 'Hello ', line: 1, column: 8 },
                    {
                        type: 'element',
                        name: 'solid',
                        line: 1,
                        column: 14,
                        children: [{ type: 'text', value: 'World', line: 1, column: 21 }],
                    },
                ],
            },
        ],
    })

    const accent = parseCoverTitleMarkup('<accent>AI</accent>').children[0]
    assert.equal(accent.type, 'element')
    assert.equal(accent.name, 'accent')
    assert.equal(accent.children[0].value, 'AI')
})

test('title and subtitle styles inherit through nested solid markup', () => {
    const runs = resolveCoverTitleRuns(
        parseCoverTitleMarkup(
            '<title>Build Apps Using</title><newline/><subtitle><solid>Kotshi AI</solid></subtitle>'
        )
    )
    const textRuns = runs.filter((run) => run.type === 'text')
    assert.equal(textRuns[0].style.typography.sizeScale, 1)
    assert.equal(textRuns[0].style.typography.fontWeight, 570)
    assert.equal(textRuns[1].style.typography.sizeScale, 0.7)
    assert.equal(textRuns[1].style.typography.fontWeight, 500)
    assert.equal(textRuns[1].style.paint.solidId, 1)
    assert.equal(textRuns[1].style.paint.foreground, null)
    assert.equal(runs.filter((run) => run.type === 'newline').length, 1)
})

test('accent adds paint without changing inherited typography', () => {
    const runs = resolveCoverTitleRuns(
        parseCoverTitleMarkup('<subtitle>Powered by <accent>AI</accent></subtitle>')
    ).filter((run) => run.type === 'text')
    assert.deepEqual(runs[0].style.typography, runs[1].style.typography)
    assert.deepEqual(runs[1].style.paint, {
        ...runs[0].style.paint,
        accent: true,
        gradient: 'theme.accentGradient',
        accentId: 1,
    })
    assert.equal(runs[1].style.typography.sizeScale, 0.7)
})

test('explicit newline and automatic word wrapping are both applied', () => {
    const context = createContext()
    const forced = layoutCoverTitle(
        context,
        '<title>Hello</title><newline/><subtitle>World</subtitle>',
        1200,
        630
    )
    assert.equal(forced.lines.length, 2)
    assert.notEqual(forced.lines[0].baseline, forced.lines[1].baseline)

    const wrapped = layoutCoverTitle(context, '<title>Build Apps Using Kotshi AI</title>', 320, 180)
    assert.ok(wrapped.lines.length > 1)
    assert.ok(wrapped.lines.every((line) => line.width <= wrapped.maxWidth + 1))
})

test('title layout assigns stable word indices for per-word animation', () => {
    const layout = layoutCoverTitle(
        createContext(),
        '<title>Build Apps</title><newline/><accent>Using AI</accent>',
        1200,
        630
    )

    assert.deepEqual(layout.words.map((word) => word.index), [0, 1, 2, 3])
    assert.equal(layout.runs.find((run) => run.text === 'Build').wordIndex, 0)
    assert.equal(layout.runs.find((run) => run.text === 'Using').wordIndex, 2)
    assert.equal(layout.runs.find((run) => run.text === 'AI').wordIndex, 3)
})

test('inline text can mix runs and a solid span is isolated to its text', () => {
    const document = parseCoverTitleMarkup('<title>Build <solid>Apps</solid> Using AI</title>')
    const runs = resolveCoverTitleRuns(document).filter((run) => run.type === 'text')
    assert.deepEqual(
        runs.map((run) => [run.value, run.style.paint.solidId !== null]),
        [
            ['Build ', false],
            ['Apps', true],
            [' Using AI', false],
        ]
    )

    const layout = layoutCoverTitle(createContext(), document, 1200, 630)
    assert.equal(layout.solidRects.length, 1)
    assert.equal(layout.solidRects[0].solidId, runs[1].style.paint.solidId)
    assert.equal(
        layout.runs
            .filter((run) => run.solidId !== null)
            .map((run) => run.text)
            .join(''),
        'Apps'
    )
})

test('entity escapes are decoded as text without becoming markup', () => {
    const decoded = resolveCoverTitleRuns(parseCoverTitleMarkup('<title>A &lt; B &amp; C</title>'))
    assert.equal(decoded[0].value, 'A < B & C')
    assert.equal(resolveCoverTitleRuns(parseCoverTitleMarkup('1 < 2'))[0].value, '1 < 2')
    assert.equal(
        resolveCoverTitleRuns(parseCoverTitleMarkup('&lt;unknown&gt;'))[0].value,
        '<unknown>'
    )
})

test('unclosed, mismatched, and unsupported tags report source locations', () => {
    assert.throws(
        () => parseCoverTitleMarkup('<title>Hello'),
        (error) =>
            error instanceof CoverTitleMarkupError &&
            error.message === 'Unclosed tag: <title>' &&
            error.line === 1 &&
            error.column === 13
    )
    assert.throws(
        () => parseCoverTitleMarkup('<title>Hello</subtitle>'),
        /Expected <\/title>, got <\/subtitle>/
    )
    assert.throws(
        () => parseCoverTitleMarkup('<unknown>Hello</unknown>'),
        /Unsupported tag: <unknown>/
    )
    assert.throws(() => parseCoverTitleMarkup('<newline>'), /<newline\/> must be self-closing/)
})

test('solid spans cannot contain explicit newlines', () => {
    const document = parseCoverTitleMarkup('<solid>Hello<newline/>World</solid>')
    assert.throws(() => resolveCoverTitleRuns(document), /<solid> cannot span multiple lines/)
})

test('Chinese rich titles render with separate, baseline-aligned centered lines', () => {
    const context = createContext()
    const layout = layoutCoverTitle(
        context,
        '<title>中文标题</title><newline/><subtitle><solid>第二行</solid></subtitle>',
        1200,
        630
    )
    assert.equal(layout.lines.length, 2)
    assert.ok(layout.runs.some((run) => run.text.includes('中文')))
    assert.equal(layout.solidRects.length, 1)
    assert.equal(layout.lines[0].x + layout.lines[0].width / 2, 600)
    assert.equal(layout.lines[1].x + layout.lines[1].width / 2, 600)
})

test('different inline sizes share the same line baseline', () => {
    const layout = layoutCoverTitle(
        createContext(),
        '<title>Hello</title> <subtitle>World</subtitle>',
        1200,
        630
    )
    assert.equal(layout.lines.length, 1)
    assert.equal(new Set(layout.runs.map((run) => run.baseline)).size, 1)
    assert.ok(layout.runs[0].fontSize > layout.runs.at(-1).fontSize)
    assert.ok(layout.runs[0].y < layout.runs.at(-1).y)
})

test('solid badge preserves typography with a rounded surface and equal vertical padding', () => {
    const layout = layoutCoverTitle(createContext(), '<title>A<solid>B</solid>C</title>', 1200, 630)
    const solid = layout.solidRects[0]
    const [first, middle, last] = layout.runs
    assert.equal(middle.ascent, middle.fontSize * 0.78)
    assert.equal(middle.descent, middle.fontSize * 0.22)
    assert.equal(middle.fontAscent, middle.fontSize * 0.82)
    assert.equal(middle.fontDescent, middle.fontSize * 0.25)
    assert.deepEqual(
        [first.fontSize, first.baseline, first.fontFamily, first.letterSpacing],
        [last.fontSize, last.baseline, last.fontFamily, last.letterSpacing]
    )
    assert.equal(middle.fontSize, first.fontSize)
    assert.equal(middle.fontFamily, first.fontFamily)
    assert.equal(middle.letterSpacing, first.letterSpacing)
    assert.equal(middle.baseline, first.baseline)
    assert.equal(first.fontWeight, 570)
    assert.equal(middle.fontWeight, 570)
    assert.equal(last.fontWeight, 570)
    const paddingX = middle.fontSize * 0.35
    const paddingY = middle.fontSize * 0.22
    assert.equal(solid.left, middle.x - paddingX)
    assert.equal(solid.width, middle.width + paddingX * 2)
    assert.equal(solid.top, middle.baseline - middle.glyphAscent - paddingY)
    assert.equal(solid.height, middle.glyphAscent + middle.glyphDescent + paddingY * 2)
    assert.ok(Math.abs(middle.y - solid.top - paddingY) < 1e-6)
    assert.ok(
        Math.abs(solid.top + solid.height - (middle.baseline + middle.glyphDescent) - paddingY) <
            1e-6
    )
    assert.equal(solid.radius, solid.height / 2)

    const narrowInk = layoutCoverTitle(
        createContext(),
        '<title><solid>Ill</solid></title>',
        1200,
        630
    )
    const wideInk = layoutCoverTitle(
        createContext(),
        '<title><solid>Wgy</solid></title>',
        1200,
        630
    )
    assert.notEqual(
        narrowInk.runs[0].glyphAscent + narrowInk.runs[0].glyphDescent,
        wideInk.runs[0].glyphAscent + wideInk.runs[0].glyphDescent
    )
    assert.notEqual(narrowInk.solidRects[0].height, wideInk.solidRects[0].height)

    const inlineTitle = layoutCoverTitle(
        createContext(),
        'Build <solid>Buildings</solid> Using <accent>Kotshi</accent>',
        2560,
        1440,
        { fontSize: 145 }
    )
    const inlineBadge = inlineTitle.solidRects[0]
    const headlineRuns = inlineTitle.runs.filter((run) => run.solidId === null && run.text.trim())
    const headlineInkHeight = Math.max(
        ...headlineRuns.map((run) => run.glyphAscent + run.glyphDescent)
    )
    const badgeRun = inlineTitle.runs.find((run) => run.solidId !== null)
    assert.ok(headlineRuns.every((run) => run.fontSize === badgeRun.fontSize))
    assert.ok(headlineRuns.every((run) => run.fontWeight === badgeRun.fontWeight))
    assert.ok(
        headlineRuns
            .filter((run) => run.lineIndex === badgeRun.lineIndex)
            .every((run) => run.baseline === badgeRun.baseline)
    )
    assert.ok(inlineBadge.height > headlineInkHeight)
    assert.ok(Math.abs(badgeRun.y - inlineBadge.top - badgeRun.fontSize * 0.22) < 1e-6)
    assert.ok(
        Math.abs(
            inlineBadge.top +
                inlineBadge.height -
                (badgeRun.baseline + badgeRun.glyphDescent) -
                badgeRun.fontSize * 0.22
        ) < 1e-6
    )
})

test('solid lines include decoration overflow and reserve separate leading', () => {
    const layout = layoutCoverTitle(
        createContext(),
        '<title>Build Apps Using</title><newline/><subtitle><solid>Kotshi AI</solid></subtitle>',
        1200,
        630
    )
    const [titleLine, subtitleLine] = layout.lines
    const solid = layout.solidRects[0]
    const titleFontSize = Math.max(...titleLine.runs.map((run) => run.fontSize))
    const subtitleFontSize = Math.max(...subtitleLine.runs.map((run) => run.fontSize))
    const leading = Math.max(titleFontSize, subtitleFontSize) * 0.1
    const expectedGap =
        titleLine.decorationBottomOverflow + subtitleLine.decorationTopOverflow + leading
    const actualGap = subtitleLine.y - (titleLine.y + titleLine.height)

    assert.ok(Math.abs(actualGap - expectedGap) < 1e-6)
    assert.ok(solid.top >= subtitleLine.y - subtitleLine.decorationTopOverflow - 1e-6)
    assert.ok(
        solid.top + 1e-6 >=
            titleLine.y + titleLine.height + titleLine.decorationBottomOverflow + leading
    )
    assert.ok(
        solid.top + solid.height <=
            subtitleLine.y + subtitleLine.height + subtitleLine.decorationBottomOverflow
    )
})

test('solid badges use theme-colored surfaces and readable white text in every title color mode', () => {
    for (const [themeStyle, theme] of Object.entries(COVER_TITLE_THEMES)) {
        for (const colorMode of ['auto', 'dark', 'light', 'custom']) {
            const context = createContext()
            drawCoverTitle(
                context,
                createImageData(320, 180, 128),
                '<title>Hello <solid>World</solid></title>',
                { themeStyle, colorMode, textColor: '#A34EB1' }
            )
            const surface = context.events.find((event) => event.type === 'background')?.color
            const textColors = context.events
                .filter((event) => event.type === 'text')
                .map((event) => event.color)

            assert.equal(surface, theme.solidSurface)
            assert.equal(textColors[1], '#FFFFFF')
            assert.ok(contrastRatio(textColors[1], surface) >= 4.5)
            if (colorMode === 'custom') assert.equal(textColors[0], '#A34EB1')
        }
    }
})

test('solid badge color stays consistent across bright and dark background regions', () => {
    const render = (backgroundValue) => {
        const context = createContext()
        drawCoverTitle(
            context,
            createImageData(320, 180, backgroundValue),
            '<title>Hello <solid>World</solid></title>',
            { themeStyle: 'blue' }
        )
        return context.events
    }
    const lighter = render(210)
    const darker = render(32)
    const surface = (events) => events.find((event) => event.type === 'background').color
    const badgeText = (events) =>
        events.find((event) => event.type === 'text' && event.text === 'World').color

    assert.equal(surface(lighter), surface(darker))
    assert.equal(badgeText(lighter), '#FFFFFF')
    assert.equal(badgeText(darker), '#FFFFFF')
})

test('accent paints only marked glyphs with a per-run, theme-specific gradient', () => {
    const markup = '<title>Powered by <accent>AI</accent></title>'
    const themeStops = new Set()
    for (const themeStyle of ['blue', 'cyan', 'green', 'violet', 'orange']) {
        const context = createContext()
        const background = createImageData(1200, 630, 128)
        const layout = layoutCoverTitle(context, markup, 1200, 630)
        drawCoverTitle(context, background, markup, { themeStyle })

        const textEvents = context.events.filter((event) => event.type === 'text')
        const accentEvent = textEvents.find((event) => event.text === 'AI')
        const normalEvents = textEvents.filter((event) => event.text !== 'AI')
        assert.ok(accentEvent)
        assert.ok(accentEvent.color && Array.isArray(accentEvent.color.stops))
        assert.equal(accentEvent.color.stops.length, 3)
        assert.equal(new Set(normalEvents.map((event) => event.color)).size, 1)
        assert.ok(normalEvents.every((event) => typeof event.color === 'string'))

        const accentRun = layout.runs.find((run) => run.text === 'AI')
        assert.equal(accentEvent.color.x0, accentRun.x)
        assert.equal(accentEvent.color.x1, accentRun.x + accentRun.width)
        assert.equal(accentEvent.color.y0, accentEvent.color.y1)
        assert.equal(new Set(accentEvent.color.stops.map((stop) => stop.color)).size, 3)
        themeStops.add(accentEvent.color.stops.map((stop) => stop.color).join(','))
    }
    assert.equal(themeStops.size, 5)
})

test('multiple accent spans each use their own complete gradient', () => {
    const context = createContext()
    drawCoverTitle(
        context,
        createImageData(1200, 630, 128),
        '<title><accent>Kotlin</accent> powered by <accent>AI</accent></title>',
        { themeStyle: 'cyan' }
    )
    const accentEvents = context.events.filter(
        (event) => event.type === 'text' && typeof event.color !== 'string'
    )
    assert.deepEqual(
        accentEvents.map((event) => event.text),
        ['Kotlin', 'AI']
    )
    assert.notEqual(accentEvents[0].color, accentEvents[1].color)
    assert.ok(accentEvents.every((event) => event.color.stops.length === 3))
})

test('solid and accent nesting keeps the solid surface and contrasts the full gradient', () => {
    const context = createContext()
    drawCoverTitle(
        context,
        createImageData(1200, 630, 128),
        '<title>Powered by <solid><accent>AI</accent></solid></title>',
        { themeStyle: 'blue' }
    )
    const background = context.events.find((event) => event.type === 'background')
    const accent = context.events.find((event) => event.type === 'text' && event.text === 'AI')
    assert.ok(background)
    assert.ok(accent)
    assert.ok(Array.isArray(accent.color.stops))

    assert.ok(accent.color.stops.every((stop) => contrastRatio(stop.color, background.color) >= 3))
})

test('solid and accent nesting works in either order with badge typography', () => {
    for (const span of [
        '<solid><accent>AI</accent></solid>',
        '<accent><solid>AI</solid></accent>',
    ]) {
        const markup = `<title>Hello ${span}</title>`
        const layout = layoutCoverTitle(createContext(), markup, 1200, 630)
        const ordinary = layout.runs.find((run) => run.text === 'Hello')
        const nested = layout.runs.find((run) => run.text === 'AI')
        assert.equal(nested.fontSize, ordinary.fontSize)
        assert.equal(nested.baseline, ordinary.baseline)
        assert.equal(nested.fontFamily, ordinary.fontFamily)
        assert.equal(nested.letterSpacing, ordinary.letterSpacing)
        assert.equal(nested.fontWeight, 570)
        assert.equal(ordinary.fontWeight, 570)
        const context = createContext()
        drawCoverTitle(context, createImageData(1200, 630), markup, { themeStyle: 'blue' })
        const background = context.events.find((event) => event.type === 'background')
        const accent = context.events.find((event) => event.type === 'text' && event.text === 'AI')
        assert.ok(background)
        assert.ok(accent && Array.isArray(accent.color.stops))
        assert.ok(
            accent.color.stops.every((stop) => contrastRatio(stop.color, background.color) >= 3)
        )
    }
})

test('solid accents on separate lines keep one badge color with legible gradients', () => {
    const width = 320
    const height = 240
    const data = new Uint8ClampedArray(width * height * 4)
    for (let y = 0; y < height; y += 1) {
        const color = y < height / 2 ? 238 : 32
        for (let x = 0; x < width; x += 1) {
            const offset = (y * width + x) * 4
            data[offset] = color
            data[offset + 1] = color
            data[offset + 2] = color
            data[offset + 3] = 255
        }
    }
    const image = { data, width, height }
    const markup =
        '<title><solid><accent>Bright region</accent></solid><newline/><solid><accent>Dark region</accent></solid></title>'
    const layout = layoutCoverTitle(createContext(), markup, width, height)
    assert.ok(layout.lines.length > 1)

    const context = createContext()
    drawCoverTitle(context, image, markup, { themeStyle: 'blue' })
    const solidBackgrounds = context.events
        .filter((event) => event.type === 'background')
        .map((event) => event.color)
    const gradients = [
        ...new Set(
            context.events
                .filter((event) => event.type === 'text' && Array.isArray(event.color?.stops))
                .map((event) => event.color)
        ),
    ].sort((first, second) => first.y1 - second.y1)

    assert.equal(new Set(solidBackgrounds).size, 1)
    assert.equal(gradients.length, solidBackgrounds.length)
    gradients.forEach((gradient, index) => {
        assert.ok(
            gradient.stops.every((stop) => contrastRatio(stop.color, solidBackgrounds[index]) >= 3),
            `gradient on line ${index + 1} must contrast with its solid background`
        )
    })
})

test('subtitle typography is inherited by accent text', () => {
    const layout = layoutCoverTitle(
        createContext(),
        '<subtitle>Powered by <accent>AI</accent></subtitle>',
        1200,
        630
    )
    const powered = layout.runs.find((run) => run.text === 'Powered')
    const accent = layout.runs.find((run) => run.text === 'AI')
    assert.equal(accent.fontSize, powered.fontSize)
    assert.equal(accent.fontWeight, powered.fontWeight)
    assert.equal(accent.ascent, powered.ascent)
    assert.equal(accent.descent, powered.descent)
    assert.equal(accent.baseline, powered.baseline)
    assert.equal(accent.lineHeight, powered.lineHeight)
    assert.equal(accent.fontFamily, powered.fontFamily)
    assert.equal(accent.letterSpacing, powered.letterSpacing)
})

test('ordinary text retains adaptive and custom foreground colors', () => {
    const lightContext = createContext()
    drawCoverTitle(lightContext, createImageData(320, 180, 238), 'Hello World', {
        themeStyle: 'blue',
    })
    assert.ok(
        lightContext.events
            .filter((event) => event.type === 'text')
            .every((event) => event.color === '#173A59')
    )

    const darkContext = createContext()
    drawCoverTitle(darkContext, createImageData(320, 180, 32), 'Hello World', {
        themeStyle: 'blue',
    })
    assert.ok(
        darkContext.events
            .filter((event) => event.type === 'text')
            .every((event) => event.color === '#E2F0FF')
    )

    const gradient = createImageData(320, 180)
    for (let y = 0; y < gradient.height; y += 1) {
        for (let x = 0; x < gradient.width; x += 1) {
            const offset = (y * gradient.width + x) * 4
            const value = x < gradient.width / 2 ? 218 : 54
            gradient.data[offset] = value
            gradient.data[offset + 1] = value
            gradient.data[offset + 2] = value
        }
    }
    const gradientContext = createContext()
    drawCoverTitle(gradientContext, gradient, '<title>Build Apps Using</title>', {
        themeStyle: 'blue',
    })
    const lineColors = new Set(
        gradientContext.events.filter((event) => event.type === 'text').map((event) => event.color)
    )
    assert.equal(lineColors.size, 1)

    const customContext = createContext()
    drawCoverTitle(customContext, createImageData(320, 180), 'Hello World', {
        colorMode: 'custom',
        textColor: '#A34EB1',
    })
    assert.ok(
        customContext.events
            .filter((event) => event.type === 'text')
            .every((event) => event.color === '#A34EB1')
    )
})

test('automatic foregrounds stay theme-colored in bright and dark image regions', () => {
    for (const [themeStyle, theme] of Object.entries(COVER_TITLE_THEMES)) {
        const brightContext = createContext()
        drawCoverTitle(brightContext, createImageData(320, 180, 238), 'Theme text', {
            themeStyle,
        })
        const brightForeground = brightContext.events.find((event) => event.type === 'text')?.color
        assert.equal(brightForeground, theme.darkForeground, `${themeStyle} dark foreground`)

        const darkContext = createContext()
        drawCoverTitle(darkContext, createImageData(320, 180, 32), 'Theme text', {
            themeStyle,
        })
        const darkForeground = darkContext.events.find((event) => event.type === 'text')?.color
        assert.equal(darkForeground, theme.lightForeground, `${themeStyle} light foreground`)
    }
})

test('adaptive foregrounds meet normal and large title contrast targets', () => {
    const normalContext = createContext()
    drawCoverTitle(normalContext, createImageData(200, 120, 180), 'Short title', {
        themeStyle: 'blue',
    })
    const normalForeground = normalContext.events.find((event) => event.type === 'text')?.color
    assert.ok(contrastRatio(normalForeground, '#B4B4B4') >= 4)

    const largeContext = createContext()
    drawCoverTitle(largeContext, createImageData(320, 180, 128), 'Theme text', {
        themeStyle: 'cyan',
    })
    const largeForeground = largeContext.events.find((event) => event.type === 'text')?.color
    assert.ok(contrastRatio(largeForeground, '#808080') >= 3)
})

test('rich titles keep one headline color and a distinct readable badge for every theme', () => {
    const markup = [
        '<title>Powered by <accent>AI</accent></title>',
        '<newline/>',
        '<title>Build Apps Using</title>',
        '<newline/>',
        '<subtitle><solid>Kotshi AI</solid></subtitle>',
    ].join('')
    const width = 1200
    const height = 630

    for (const themeStyle of ['blue', 'cyan', 'green', 'violet', 'orange']) {
        const context = createContext()
        const background = generateCoverBackground(width, height, themeStyle, 'rich-title-color')
        const layout = layoutCoverTitle(createContext(), markup, width, height)
        drawCoverTitle(context, background, markup, { themeStyle })

        const textEvents = context.events.filter((event) => event.type === 'text')
        const accent = textEvents.find((event) => event.text === 'AI')
        const inheritedText = textEvents.filter(
            (event) => event.text !== 'AI' && event.text !== 'Kotshi AI'
        )
        const badgeText = textEvents.find((event) => event.text === 'Kotshi AI')
        const solidBackground = context.events.find((event) => event.type === 'background')
        const foreground = inheritedText[0]?.color
        const theme = COVER_TITLE_THEMES[themeStyle]
        const foregroundHue = oklchHue(foreground)
        const themeHueDistance = Math.min(
            hueDistance(foregroundHue, oklchHue(theme.darkForeground)),
            hueDistance(foregroundHue, oklchHue(theme.lightForeground))
        )

        assert.ok(accent && Array.isArray(accent.color.stops), `${themeStyle} accent gradient`)
        assert.ok(solidBackground, `${themeStyle} solid surface`)
        assert.equal(solidBackground.color, theme.solidSurface)
        assert.equal(badgeText?.color, '#FFFFFF')
        assert.equal(new Set(inheritedText.map((event) => event.color)).size, 1, themeStyle)
        assert.ok(
            inheritedText.every((event) => typeof event.color === 'string'),
            themeStyle
        )
        assert.notEqual(foreground, '#000000', `${themeStyle} avoids pure black`)
        assert.notEqual(foreground, '#FFFFFF', `${themeStyle} avoids pure white`)
        assert.ok(themeHueDistance < 0.02, `${themeStyle} foreground preserves theme hue`)
        assert.ok(
            blockContrastPercentile(background, layout, foreground) >= 3,
            `${themeStyle} 15th-percentile large-title contrast`
        )
        assert.ok(contrastRatio(badgeText.color, solidBackground.color) >= 4.5)
        const solidChannels = [1, 3, 5].map((index) =>
            Number.parseInt(solidBackground.color.slice(index, index + 2), 16)
        )
        assert.ok(
            Math.max(...solidChannels) - Math.min(...solidChannels) > 12,
            `${themeStyle} solid surface stays theme-colored`
        )
        assert.ok(
            Math.max(
                ...[1, 3, 5].map((index) => Number.parseInt(foreground.slice(index, index + 2), 16))
            ) -
                Math.min(
                    ...[1, 3, 5].map((index) =>
                        Number.parseInt(foreground.slice(index, index + 2), 16)
                    )
                ) >
                12,
            `${themeStyle} foreground stays chromatic`
        )
    }
})

test('block-level foreground does not adapt separately to each line background', () => {
    const width = 480
    const height = 270
    const colors = [238, 32, 190]
    const data = new Uint8ClampedArray(width * height * 4)
    for (let y = 0; y < height; y += 1) {
        const color = colors[Math.min(2, Math.floor((y / height) * colors.length))]
        for (let x = 0; x < width; x += 1) {
            const offset = (y * width + x) * 4
            data[offset] = color
            data[offset + 1] = color
            data[offset + 2] = color
            data[offset + 3] = 255
        }
    }
    const context = createContext()
    drawCoverTitle(
        context,
        { data, width, height },
        '<title>Powered by <accent>AI</accent></title><newline/><title>Build Apps Using</title><newline/><subtitle><solid>Kotshi AI</solid></subtitle>',
        { themeStyle: 'cyan' }
    )
    const normalTextColors = context.events
        .filter((event) => event.type === 'text' && !['AI', 'Kotshi AI'].includes(event.text))
        .map((event) => event.color)
    assert.equal(new Set(normalTextColors).size, 1)
})

test('custom headline color leaves the readable badge and accent gradient intact', () => {
    const context = createContext()
    const markup =
        '<title>Powered by <accent>AI</accent></title><newline/><title>Build Apps Using</title><newline/><subtitle><solid>Kotshi AI</solid></subtitle>'
    drawCoverTitle(context, createImageData(1200, 630), markup, {
        themeStyle: 'cyan',
        colorMode: 'custom',
        textColor: '#A34EB1',
    })

    const textEvents = context.events.filter((event) => event.type === 'text')
    const accent = textEvents.find((event) => event.text === 'AI')
    const ordinaryText = textEvents.filter(
        (event) => event.text !== 'AI' && event.text !== 'Kotshi AI'
    )
    const badgeText = textEvents.find((event) => event.text === 'Kotshi AI')
    const solidBackground = context.events.find((event) => event.type === 'background')
    assert.ok(accent && Array.isArray(accent.color.stops))
    assert.ok(ordinaryText.every((event) => event.color === '#A34EB1'))
    assert.equal(badgeText?.color, '#FFFFFF')
    assert.ok(solidBackground)
    assert.ok(contrastRatio('#FFFFFF', solidBackground.color) >= 4.5)
})

test('title size remains adjustable while long titles fit their centered block', () => {
    const context = createContext()
    const smaller = layoutCoverTitle(context, 'Powering K2', 1200, 630, { sizeScale: 0.7 })
    const larger = layoutCoverTitle(context, 'Powering K2', 1200, 630, { sizeScale: 1.35 })
    assert.ok(larger.fontSize > smaller.fontSize)

    const longTitle = layoutCoverTitle(
        context,
        'Research Begins Where Order Meets the Unknown',
        720,
        400,
        { sizeScale: 1.3 }
    )
    assert.ok(longTitle.textHeight <= 400 * 0.76 + 1)
    assert.ok(longTitle.lines.every((line) => line.width <= longTitle.maxWidth + 1))

    const hdTitle = layoutCoverTitle(context, 'Powering K2', 1280, 720)
    const fourKTitle = layoutCoverTitle(context, 'Powering K2', 3840, 2160)
    assert.ok(fourKTitle.fontSize >= hdTitle.fontSize * 2.9)

    const explicitSize = layoutCoverTitle(context, 'Powering K2', 2560, 1440, { fontSize: 180 })
    assert.equal(explicitSize.fontSize, 180)
})

test('markup only changes title rendering, never the seeded background', () => {
    const first = generateCoverBackground(128, 72, 'green', 'abc')
    const plain = resolveCoverTitleRuns(parseCoverTitleMarkup('Hello'))
    const rich = resolveCoverTitleRuns(
        parseCoverTitleMarkup(
            '<title>Hello</title><newline/><subtitle><solid>World</solid></subtitle>'
        )
    )
    const repeated = generateCoverBackground(128, 72, 'green', 'abc')
    assert.notDeepEqual(plain, rich)
    assert.deepEqual(first.data, repeated.data)
})
