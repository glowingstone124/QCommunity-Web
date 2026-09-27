import {
    COVER_TITLE_FONT_FAMILY,
    parseCoverTitleMarkup,
    resolveCoverTitleRuns,
} from './coverTitleMarkup.js'

export const COVER_TITLE_THEMES = Object.freeze({
    blue: Object.freeze({
        darkForeground: '#173A59',
        lightForeground: '#E2F0FF',
        solidSurface: '#255BB7',
        accentGradient: Object.freeze(['#4B78D1', '#65C9E8', '#8C7DDB']),
    }),
    cyan: Object.freeze({
        darkForeground: '#244B59',
        lightForeground: '#D7EFF2',
        solidSurface: '#177C90',
        accentGradient: Object.freeze(['#2D7180', '#377FA8', '#655FA5']),
    }),
    green: Object.freeze({
        darkForeground: '#28472E',
        lightForeground: '#EDF3D9',
        solidSurface: '#2C785B',
        accentGradient: Object.freeze(['#6EAF4D', '#56BDA4', '#5A8ED4']),
    }),
    violet: Object.freeze({
        darkForeground: '#342D5A',
        lightForeground: '#EFEAFF',
        solidSurface: '#66279A',
        accentGradient: Object.freeze(['#7657CA', '#AE6ECD', '#5F9EDA']),
    }),
    orange: Object.freeze({
        darkForeground: '#62351F',
        lightForeground: '#FFF0D9',
        solidSurface: '#A94F28',
        accentGradient: Object.freeze(['#E65F32', '#F2A23A', '#D74B68']),
    }),
})

const ACCENT_MIN_CONTRAST = 3
const SOLID_FOREGROUND = '#FFFFFF'
const TITLE_MIN_CONTRAST = 4
const LARGE_TITLE_MIN_CONTRAST = 3
const COLOR_ADJUSTMENT_STEP = 0.03
const SOLID_LINE_GAP_SCALE = 0.1

function linearChannel(value) {
    const channel = value / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(red, green, blue) {
    return (
        0.2126 * linearChannel(red) + 0.7152 * linearChannel(green) + 0.0722 * linearChannel(blue)
    )
}

function parseHexColor(value) {
    const match = /^#?([0-9a-f]{6})$/i.exec(value || '')
    if (!match) return null
    return [
        Number.parseInt(match[1].slice(0, 2), 16),
        Number.parseInt(match[1].slice(2, 4), 16),
        Number.parseInt(match[1].slice(4, 6), 16),
    ]
}

function getTheme(themeStyle) {
    return COVER_TITLE_THEMES[themeStyle] || COVER_TITLE_THEMES.blue
}

function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value))
}

function rgbToOklch(color) {
    const [red, green, blue] = color.map(linearChannel)
    const lightRoot = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue)
    const middleRoot = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue)
    const blueRoot = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue)
    const lightness = 0.2104542553 * lightRoot + 0.793617785 * middleRoot - 0.0040720468 * blueRoot
    const labA = 1.9779984951 * lightRoot - 2.428592205 * middleRoot + 0.4505937099 * blueRoot
    const labB = 0.0259040371 * lightRoot + 0.7827717662 * middleRoot - 0.808675766 * blueRoot
    return [lightness, Math.hypot(labA, labB), Math.atan2(labB, labA)]
}

function oklchToLinearRgb(lightness, chroma, hue) {
    const labA = chroma * Math.cos(hue)
    const labB = chroma * Math.sin(hue)
    const lightRoot = lightness + 0.3963377774 * labA + 0.2158037573 * labB
    const middleRoot = lightness - 0.1055613458 * labA - 0.0638541728 * labB
    const blueRoot = lightness - 0.0894841775 * labA - 1.291485548 * labB
    const light = lightRoot ** 3
    const middle = middleRoot ** 3
    const blue = blueRoot ** 3
    return [
        4.0767416621 * light - 3.3077115913 * middle + 0.2309699292 * blue,
        -1.2684380046 * light + 2.6097574011 * middle - 0.3413193965 * blue,
        -0.0041960863 * light - 0.7034186147 * middle + 1.707614701 * blue,
    ]
}

function oklchToRgb(lightness, chroma, hue) {
    const isInGamut = (channels) => channels.every((channel) => channel >= 0 && channel <= 1)
    let linearRgb = oklchToLinearRgb(lightness, chroma, hue)
    if (!isInGamut(linearRgb)) {
        let minimumChroma = 0
        let maximumChroma = chroma
        for (let iteration = 0; iteration < 16; iteration += 1) {
            const candidateChroma = (minimumChroma + maximumChroma) / 2
            const candidate = oklchToLinearRgb(lightness, candidateChroma, hue)
            if (isInGamut(candidate)) minimumChroma = candidateChroma
            else maximumChroma = candidateChroma
        }
        linearRgb = oklchToLinearRgb(lightness, minimumChroma, hue)
    }

    return linearRgb.map((channel) => {
        const encoded =
            channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055
        return Math.round(clamp(encoded, 0, 1) * 255)
    })
}

function shiftLightness(color, amount) {
    const [lightness, chroma, hue] = rgbToOklch(color)
    return oklchToRgb(clamp(lightness + amount, 0.16, 0.97), chroma, hue)
}

function colorToHex(color) {
    return `#${color
        .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()}`
}

function minimumContrast(samples, foreground) {
    const foregroundLuminance = relativeLuminance(...foreground)
    if (!samples.length) return 0
    return Math.min(
        ...samples.map((background) => contrastFromLuminance(background, foregroundLuminance))
    )
}

function percentileContrast(samples, foreground, percentile = 0.15) {
    if (!samples.length) return 0
    const foregroundLuminance = relativeLuminance(...foreground)
    const contrasts = samples
        .map((background) => contrastFromLuminance(background, foregroundLuminance))
        .sort((first, second) => first - second)
    const position = (contrasts.length - 1) * percentile
    const lowerIndex = Math.floor(position)
    const upperIndex = Math.ceil(position)
    return (
        contrasts[lowerIndex] +
        (contrasts[upperIndex] - contrasts[lowerIndex]) * (position - lowerIndex)
    )
}

function contrastFromLuminance(first, second) {
    return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

function scoreForeground(samples, color) {
    return percentileContrast(samples, color)
}

function adjustForContrast(color, samples, direction, targetContrast) {
    const [lightness, chroma, hue] = rgbToOklch(color)
    const limit = direction < 0 ? 0.18 : 0.97
    const distance = direction < 0 ? lightness - limit : limit - lightness
    let bestColor = color
    let bestScore = scoreForeground(samples, color)
    if (bestScore >= targetContrast || distance <= 0) return bestColor

    const steps = Math.ceil(distance / COLOR_ADJUSTMENT_STEP)
    for (let step = 1; step <= steps; step += 1) {
        const adjustedLightness = clamp(
            lightness + direction * step * COLOR_ADJUSTMENT_STEP,
            0.18,
            0.97
        )
        const adjusted = oklchToRgb(adjustedLightness, chroma, hue)
        const score = scoreForeground(samples, adjusted)
        if (score > bestScore) {
            bestColor = adjusted
            bestScore = score
        }
        if (score >= targetContrast) return adjusted
    }
    return bestColor
}

function chooseThemeForeground(samples, theme, targetContrast) {
    const darkCandidate = adjustForContrast(
        parseHexColor(theme.darkForeground),
        samples,
        -1,
        targetContrast
    )
    const lightCandidate = adjustForContrast(
        parseHexColor(theme.lightForeground),
        samples,
        1,
        targetContrast
    )
    return scoreForeground(samples, lightCandidate) > scoreForeground(samples, darkCandidate)
        ? lightCandidate
        : darkCandidate
}

function chooseSolidPaint(theme) {
    return {
        foreground: parseHexColor(SOLID_FOREGROUND),
        backgroundColor: parseHexColor(theme.solidSurface),
    }
}

function adjustGradientForContrast(samples, gradientStops) {
    const source = gradientStops.map(parseHexColor)
    const score = (colors) => Math.min(...colors.map((color) => percentileContrast(samples, color)))
    let bestColors = source
    let bestScore = score(source)
    if (bestScore >= ACCENT_MIN_CONTRAST) return bestColors

    const meanBackground = samples.reduce((total, value) => total + value, 0) / samples.length
    const preferredDirection = meanBackground < 0.5 ? 1 : -1
    for (const direction of [preferredDirection, -preferredDirection]) {
        for (let step = 1; step <= 18; step += 1) {
            const adjusted = source.map((color) => shiftLightness(color, direction * step * 0.025))
            const adjustedScore = score(adjusted)
            if (adjustedScore > bestScore) {
                bestColors = adjusted
                bestScore = adjustedScore
            }
            if (adjustedScore >= ACCENT_MIN_CONTRAST) return adjusted
        }
    }
    return bestColors
}

function measureRun(context, text, typography, fontSize) {
    context.font = `${typography.fontWeight} ${fontSize}px ${typography.fontFamily || COVER_TITLE_FONT_FAMILY}`
    context.letterSpacing = `${typography.letterSpacing || 0}px`
    const measured = context.measureText(text)
    const fontMetrics = context.measureText('Hg')
    const ascent =
        Number.isFinite(fontMetrics.actualBoundingBoxAscent) &&
        fontMetrics.actualBoundingBoxAscent > 0
            ? fontMetrics.actualBoundingBoxAscent
            : fontSize * 0.78
    const descent = Number.isFinite(fontMetrics.actualBoundingBoxDescent)
        ? fontMetrics.actualBoundingBoxDescent
        : fontSize * 0.22
    const fontAscent =
        Number.isFinite(fontMetrics.fontBoundingBoxAscent) && fontMetrics.fontBoundingBoxAscent > 0
            ? fontMetrics.fontBoundingBoxAscent
            : ascent
    const fontDescent =
        Number.isFinite(fontMetrics.fontBoundingBoxDescent) &&
        fontMetrics.fontBoundingBoxDescent >= 0
            ? fontMetrics.fontBoundingBoxDescent
            : descent
    const glyphAscent =
        Number.isFinite(measured.actualBoundingBoxAscent) && measured.actualBoundingBoxAscent > 0
            ? measured.actualBoundingBoxAscent
            : ascent
    const glyphDescent =
        Number.isFinite(measured.actualBoundingBoxDescent) && measured.actualBoundingBoxDescent > 0
            ? measured.actualBoundingBoxDescent
            : descent
    return {
        text,
        fontSize,
        fontWeight: typography.fontWeight,
        fontFamily: typography.fontFamily || COVER_TITLE_FONT_FAMILY,
        letterSpacing: typography.letterSpacing || 0,
        width: measured.width,
        ascent,
        descent,
        fontAscent,
        fontDescent,
        height: ascent + descent,
        glyphAscent,
        glyphDescent,
        lineHeight: fontSize * typography.lineHeight,
    }
}

function createRun(sourceRun, context, baseSize, scale) {
    const typography = sourceRun.style.typography
    const fontSize = baseSize * typography.sizeScale * scale
    const metrics = measureRun(context, sourceRun.value, typography, fontSize)
    return {
        ...metrics,
        solidId: sourceRun.style.paint.solidId,
        accentId: sourceRun.style.paint.accentId,
        style: {
            typography: {
                ...typography,
                fontSize,
            },
            paint: { ...sourceRun.style.paint },
        },
    }
}

function createTextAtom(text, sourceRun, context, baseSize, scale) {
    const run = createRun({ ...sourceRun, value: text }, context, baseSize, scale)
    return {
        type: 'text',
        parts: [run],
        width: run.width,
        ascent: run.ascent,
        descent: run.descent,
        maxFontSize: run.fontSize,
        lineHeight: run.lineHeight,
        accentId: run.accentId,
        isWhitespace: /^\s+$/u.test(text),
    }
}

function appendWordAtoms(text, sourceRun, context, baseSize, scale, output) {
    if (!text) return
    output.push(createTextAtom(text, sourceRun, context, baseSize, scale))
}

function createTextAtoms(sourceRun, context, baseSize, scale) {
    const atoms = []
    let word = ''
    let whitespace = ''
    const flushWord = () => {
        if (word) appendWordAtoms(word, sourceRun, context, baseSize, scale, atoms)
        word = ''
    }
    const flushWhitespace = () => {
        if (whitespace) {
            atoms.push(createTextAtom(whitespace, sourceRun, context, baseSize, scale))
        }
        whitespace = ''
    }

    for (const character of Array.from(sourceRun.value)) {
        if (/\s/u.test(character)) {
            flushWord()
            whitespace += character
            continue
        }
        flushWhitespace()
        word += character
    }
    flushWord()
    flushWhitespace()
    return atoms
}

function createSolidAtom(sourceRuns, context, baseSize, scale) {
    const parts = sourceRuns.map((sourceRun) => createRun(sourceRun, context, baseSize, scale))
    const contentWidth = parts.reduce((total, part) => total + part.width, 0)
    const maxFontSize = Math.max(...parts.map((part) => part.fontSize))
    const solidStyle = sourceRuns[0].style.paint
    const paddingX = maxFontSize * solidStyle.paddingX
    const paddingY = maxFontSize * solidStyle.paddingY
    const ascent = Math.max(...parts.map((part) => part.ascent))
    const descent = Math.max(...parts.map((part) => part.descent))
    const fontAscent = Math.max(...parts.map((part) => part.fontAscent))
    const fontDescent = Math.max(...parts.map((part) => part.fontDescent))

    return {
        type: 'solid',
        parts,
        contentWidth,
        paddingX,
        paddingY,
        width: contentWidth + paddingX * 2,
        ascent,
        descent,
        fontAscent,
        fontDescent,
        glyphAscent: Math.max(...parts.map((part) => part.glyphAscent)),
        glyphDescent: Math.max(...parts.map((part) => part.glyphDescent)),
        lineHeight: Math.max(...parts.map((part) => part.lineHeight)),
        maxFontSize,
        solidId: solidStyle.solidId,
        radiusScale: solidStyle.radius,
    }
}

function createSegmentAtoms(sourceRuns, context, baseSize, scale) {
    const atoms = []
    for (let index = 0; index < sourceRuns.length; index += 1) {
        const sourceRun = sourceRuns[index]
        if (sourceRun.style.paint.solidId === null) {
            atoms.push(...createTextAtoms(sourceRun, context, baseSize, scale))
            continue
        }

        const group = [sourceRun]
        while (
            index + 1 < sourceRuns.length &&
            sourceRuns[index + 1].style.paint.solidId === sourceRun.style.paint.solidId
        ) {
            group.push(sourceRuns[index + 1])
            index += 1
        }
        atoms.push(createSolidAtom(group, context, baseSize, scale))
    }
    return atoms
}

function splitOversizedTextAtom(atom, maxWidth, context) {
    if (atom.type !== 'text' || atom.parts.length !== 1) return [atom]
    const sourcePart = atom.parts[0]
    if (atom.isWhitespace) return [atom]

    const glyphAtoms = Array.from(sourcePart.text, (character) => {
        const part = measureRun(
            context,
            character,
            sourcePart.style.typography,
            sourcePart.fontSize
        )
        return {
            type: 'text',
            parts: [
                {
                    ...part,
                    solidId: sourcePart.solidId,
                    accentId: sourcePart.accentId,
                    style: sourcePart.style,
                },
            ],
            width: part.width,
            ascent: part.ascent,
            descent: part.descent,
            maxFontSize: part.fontSize,
            lineHeight: part.lineHeight,
            accentId: sourcePart.accentId,
            isWhitespace: false,
        }
    })
    return glyphAtoms.length ? glyphAtoms : [atom]
}

function wrapSegment(sourceRuns, context, baseSize, scale, maxWidth) {
    const atoms = createSegmentAtoms(sourceRuns, context, baseSize, scale)
    const lines = []
    let currentAtoms = []
    let currentWidth = 0
    let pendingWhitespace = []

    const finishLine = () => {
        if (currentAtoms.length) lines.push(currentAtoms)
        currentAtoms = []
        currentWidth = 0
        pendingWhitespace = []
    }

    const appendAtom = (atom) => {
        if (atom.isWhitespace) {
            if (currentAtoms.length) pendingWhitespace.push(atom)
            return
        }

        const whitespaceWidth = pendingWhitespace.reduce((total, item) => total + item.width, 0)
        if (currentAtoms.length && currentWidth + whitespaceWidth + atom.width > maxWidth) {
            finishLine()
        } else if (currentAtoms.length) {
            currentAtoms.push(...pendingWhitespace)
            currentWidth += whitespaceWidth
        }
        pendingWhitespace = []

        if (atom.width > maxWidth) {
            if (currentAtoms.length) finishLine()
            const glyphs = splitOversizedTextAtom(atom, maxWidth, context)
            for (const glyph of glyphs) {
                if (currentAtoms.length && currentWidth + glyph.width > maxWidth) finishLine()
                currentAtoms.push(glyph)
                currentWidth += glyph.width
            }
            return
        }

        currentAtoms.push(atom)
        currentWidth += atom.width
    }

    for (const atom of atoms) appendAtom(atom)
    finishLine()
    return lines.length ? lines : [[]]
}

function createLineMetrics(atoms, baseSize, scale) {
    if (!atoms.length) {
        const fontSize = baseSize * scale
        const ascent = fontSize * 0.78
        const descent = fontSize * 0.22
        const height = fontSize * 1.18
        return {
            ascent,
            descent,
            height,
            maxFontSize: fontSize,
            topOverflow: 0,
            bottomOverflow: 0,
            hasSolid: false,
        }
    }

    const ascent = Math.max(...atoms.map((atom) => atom.ascent))
    const descent = Math.max(...atoms.map((atom) => atom.descent))
    const maxFontSize = Math.max(...atoms.map((atom) => atom.maxFontSize))
    const solidAtoms = atoms.filter((atom) => atom.type === 'solid')
    const topOverflow = Math.max(
        0,
        ...solidAtoms.map((atom) => atom.glyphAscent + atom.paddingY - ascent)
    )
    const bottomOverflow = Math.max(
        0,
        ...solidAtoms.map((atom) => atom.glyphDescent + atom.paddingY - descent)
    )
    const hasSolid = solidAtoms.length > 0
    const lineHeight = Math.max(...atoms.map((atom) => atom.lineHeight))
    return {
        ascent,
        descent,
        height: Math.max(ascent + descent, lineHeight),
        maxFontSize,
        topOverflow,
        bottomOverflow,
        hasSolid,
    }
}

function layoutSegments(segments, context, width, height, baseSize, maxWidth, scale) {
    const lines = segments.flatMap((segment) =>
        wrapSegment(segment, context, baseSize, scale, maxWidth)
    )
    const lineMetrics = lines.map((atoms) => createLineMetrics(atoms, baseSize, scale))
    const lineGaps = lineMetrics.slice(0, -1).map((metrics, index) => {
        const nextMetrics = lineMetrics[index + 1]
        return metrics.hasSolid || nextMetrics.hasSolid
            ? metrics.bottomOverflow +
                  nextMetrics.topOverflow +
                  Math.max(metrics.maxFontSize, nextMetrics.maxFontSize) * SOLID_LINE_GAP_SCALE
            : 0
    })
    const totalHeight =
        lineMetrics.reduce((total, line) => total + line.height, 0) +
        lineGaps.reduce((total, gap) => total + gap, 0) +
        (lineMetrics[0]?.topOverflow ?? 0) +
        (lineMetrics.at(-1)?.bottomOverflow ?? 0)
    const top = (height - totalHeight) / 2
    const positionedLines = []
    const runs = []
    const solidRects = []
    const words = []
    let nextWordIndex = 0
    let lineTop = top + (lineMetrics[0]?.topOverflow ?? 0)

    lines.forEach((atoms, lineIndex) => {
        const metrics = lineMetrics[lineIndex]
        const lineWidth = atoms.reduce((total, atom) => total + atom.width, 0)
        const left = (width - lineWidth) / 2
        const baseline = lineTop + metrics.ascent
        const line = {
            index: lineIndex,
            x: left,
            y: lineTop,
            width: lineWidth,
            height: metrics.height,
            ascent: metrics.ascent,
            descent: metrics.descent,
            decorationTopOverflow: metrics.topOverflow,
            decorationBottomOverflow: metrics.bottomOverflow,
            baseline,
            runs: [],
        }
        let x = left

        for (const atom of atoms) {
            const isWord = !atom.isWhitespace
            const wordIndex = isWord ? nextWordIndex++ : null
            const word = isWord
                ? {
                      index: wordIndex,
                      lineIndex,
                      left: x,
                      top: baseline - atom.ascent,
                      width: atom.width,
                      height: atom.ascent + atom.descent,
                      runs: [],
                  }
                : null
            if (atom.type === 'solid') {
                const rect = {
                    solidId: atom.solidId,
                    lineIndex,
                    wordIndex,
                    left: x,
                    top: baseline - atom.glyphAscent - atom.paddingY,
                    width: atom.width,
                    height: atom.glyphAscent + atom.glyphDescent + atom.paddingY * 2,
                    radius: Math.min(
                        atom.maxFontSize * atom.radiusScale,
                        (atom.glyphAscent + atom.glyphDescent + atom.paddingY * 2) / 2
                    ),
                }
                solidRects.push(rect)
                let partX = x + atom.paddingX
                for (const part of atom.parts) {
                    const run = {
                        ...part,
                        x: partX,
                        y: baseline - part.glyphAscent,
                        height: part.glyphAscent + part.glyphDescent,
                        baseline,
                        lineIndex,
                        wordIndex,
                        solidId: atom.solidId,
                        accentId: part.accentId,
                        style: part.style,
                    }
                    runs.push(run)
                    line.runs.push(run)
                    word?.runs.push(run)
                    partX += part.width
                }
                x += atom.width
                if (word) words.push(word)
                continue
            }

            for (const part of atom.parts) {
                const run = {
                    ...part,
                    x,
                    y: baseline - part.glyphAscent,
                    height: part.glyphAscent + part.glyphDescent,
                    baseline,
                    lineIndex,
                    wordIndex,
                    solidId: null,
                    accentId: part.accentId,
                    style: part.style,
                }
                runs.push(run)
                line.runs.push(run)
                word?.runs.push(run)
                x += part.width
            }
            if (word) words.push(word)
        }

        positionedLines.push(line)
        lineTop += metrics.height + (lineGaps[lineIndex] || 0)
    })

    const maxLineWidth = positionedLines.reduce((maximum, line) => Math.max(maximum, line.width), 0)
    return {
        lines: positionedLines,
        runs,
        words,
        solidRects,
        fontSize: baseSize * scale,
        lineHeight: positionedLines[0]?.height ?? 0,
        maxWidth,
        textWidth: maxLineWidth,
        textHeight: totalHeight,
        textRect: {
            left: Math.max(0, Math.floor((width - maxLineWidth) / 2)),
            top: Math.max(0, Math.floor(top)),
            width: Math.min(width, Math.ceil(maxLineWidth)),
            height: Math.min(height, Math.ceil(totalHeight)),
        },
        blockTop: top,
    }
}

export function layoutCoverTitle(context, markup, width, height, options = {}) {
    const document = typeof markup === 'string' ? parseCoverTitleMarkup(markup) : markup
    const sourceRuns = resolveCoverTitleRuns(document)
    if (!sourceRuns.some((run) => run.type === 'text' && run.value.trim())) return null

    const segments = [[]]
    for (const run of sourceRuns) {
        if (run.type === 'newline') {
            segments.push([])
        } else {
            segments[segments.length - 1].push(run)
        }
    }

    const sizeScale = Math.max(0.7, Math.min(1.35, Number(options.sizeScale) || 1))
    const requestedFontSize = Number(options.fontSize)
    const baseSize =
        Number.isFinite(requestedFontSize) && requestedFontSize >= 16
            ? requestedFontSize
            : Math.max(
                  16,
                  Math.floor(
                      Math.min(Math.floor(height * 0.145), Math.floor(width * 0.09)) * sizeScale
                  )
              )
    const maxWidth = width * 0.76
    const maxHeight = height * 0.76
    let scale = 1
    let layout = layoutSegments(segments, context, width, height, baseSize, maxWidth, scale)

    for (
        let attempt = 0;
        (layout.textHeight > maxHeight || layout.textWidth > maxWidth) && attempt < 18;
        attempt += 1
    ) {
        const heightFit = maxHeight / Math.max(1, layout.textHeight)
        const widthFit = maxWidth / Math.max(1, layout.textWidth)
        const fitScale = Math.min(heightFit, widthFit)
        scale *= Math.min(0.9, Math.max(0.12, fitScale * 0.94))
        layout = layoutSegments(segments, context, width, height, baseSize, maxWidth, scale)
    }

    return layout
}

function samplePixelLuminance(imageData, x, y) {
    const { data, width, height } = imageData
    let red = 0
    let green = 0
    let blue = 0
    let count = 0
    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            const sampleX = Math.max(0, Math.min(width - 1, x + offsetX))
            const sampleY = Math.max(0, Math.min(height - 1, y + offsetY))
            const offset = (sampleY * width + sampleX) * 4
            red += data[offset]
            green += data[offset + 1]
            blue += data[offset + 2]
            count += 1
        }
    }
    return relativeLuminance(red / count, green / count, blue / count)
}

function sampleRegion(imageData, rect, originX = 0, originY = 0) {
    const values = []
    const columns = 7
    const rows = 7
    for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
            const x = Math.min(
                imageData.width - 1,
                Math.max(
                    0,
                    Math.floor(rect.left + ((column + 0.5) * rect.width) / columns - originX)
                )
            )
            const y = Math.min(
                imageData.height - 1,
                Math.max(0, Math.floor(rect.top + ((row + 0.5) * rect.height) / rows - originY))
            )
            values.push(samplePixelLuminance(imageData, x, y))
        }
    }

    const mean = values.reduce((total, value) => total + value, 0) / values.length
    const variance = values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length
    return {
        values,
        mean,
        min: Math.min(...values),
        max: Math.max(...values),
        stdDev: Math.sqrt(variance),
    }
}

function expandRect(rect, width, height, padding) {
    const left = Math.max(0, Math.floor(rect.left - padding))
    const top = Math.max(0, Math.floor(rect.top - padding))
    const right = Math.min(width, Math.ceil(rect.left + rect.width + padding))
    const bottom = Math.min(height, Math.ceil(rect.top + rect.height + padding))
    return {
        left,
        top,
        width: Math.max(1, right - left),
        height: Math.max(1, bottom - top),
    }
}

function stabilizeTitleRegion(context, rect, strength) {
    if (!context.getImageData || !context.putImageData || !rect.width || !rect.height) return null
    const region = context.getImageData(rect.left, rect.top, rect.width, rect.height)
    const { data, width, height } = region
    const step = Math.max(1, Math.floor(Math.min(width, height) / 40))
    const mean = [0, 0, 0]
    let count = 0
    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
            const offset = (y * width + x) * 4
            mean[0] += data[offset]
            mean[1] += data[offset + 1]
            mean[2] += data[offset + 2]
            count += 1
        }
    }
    for (let channel = 0; channel < 3; channel += 1) mean[channel] /= count

    for (let y = 0; y < height; y += 1) {
        const normalizedY = (y + 0.5 - height / 2) / Math.max(1, height / 2)
        for (let x = 0; x < width; x += 1) {
            const normalizedX = (x + 0.5 - width / 2) / Math.max(1, width / 2)
            const mask = strength * Math.exp(-2.6 * (normalizedX ** 2 + normalizedY ** 2))
            const offset = (y * width + x) * 4
            data[offset] += (mean[0] - data[offset]) * mask
            data[offset + 1] += (mean[1] - data[offset + 1]) * mask
            data[offset + 2] += (mean[2] - data[offset + 2]) * mask
        }
    }
    context.putImageData(region, rect.left, rect.top)
    return region
}

function chooseTextColor(samples, options, theme, targetContrast) {
    if (options.colorMode === 'dark') return parseHexColor(theme.darkForeground)
    if (options.colorMode === 'light') return parseHexColor(theme.lightForeground)
    if (options.colorMode === 'custom') {
        const customColor = parseHexColor(options.textColor)
        if (customColor) return customColor
    }
    return chooseThemeForeground(samples, theme, targetContrast)
}

function roundedRect(context, rect) {
    const radius = Math.max(0, Math.min(rect.radius, rect.width / 2, rect.height / 2))
    const right = rect.left + rect.width
    const bottom = rect.top + rect.height
    context.beginPath()
    context.moveTo(rect.left + radius, rect.top)
    context.lineTo(right - radius, rect.top)
    context.arcTo(right, rect.top, right, rect.top + radius, radius)
    context.lineTo(right, bottom - radius)
    context.arcTo(right, bottom, right - radius, bottom, radius)
    context.lineTo(rect.left + radius, bottom)
    context.arcTo(rect.left, bottom, rect.left, bottom - radius, radius)
    context.lineTo(rect.left, rect.top + radius)
    context.arcTo(rect.left, rect.top, rect.left + radius, rect.top, radius)
    context.closePath()
    context.fill()
}

function getAccentGroupKey(run) {
    return `${run.accentId}:${run.lineIndex}`
}

function createAccentGradient(context, bounds, colors) {
    const middleY = (bounds.top + bounds.bottom) / 2
    const gradient = context.createLinearGradient(bounds.left, middleY, bounds.right, middleY)
    gradient.addColorStop(0, colorToHex(colors[0]))
    gradient.addColorStop(0.5, colorToHex(colors[1]))
    gradient.addColorStop(1, colorToHex(colors[2]))
    return gradient
}

function getWordMotion(layout, wordIndex, options) {
    const progress = Number(options.animationProgress)
    if (!Number.isFinite(progress) || wordIndex === null || wordIndex === undefined) {
        return { offset: 0, alpha: 1 }
    }

    const clampedProgress = clamp(progress, 0, 1)
    const duration = clamp(Number(options.wordDuration) || 0.42, 0.16, 0.9)
    const stagger = clamp(Number(options.wordStagger) || 0.12, 0.02, 0.35)
    const totalDuration = duration + Math.max(0, layout.words.length - 1) * stagger
    const localProgress = clamp(
        (clampedProgress * totalDuration - wordIndex * stagger) / duration,
        0,
        1
    )
    // A cubic ease with a restrained overshoot makes each word feel physical
    // while keeping the final frame exactly aligned with the static cover.
    const eased = localProgress === 0 ? 0 : 1 - (1 - localProgress) ** 3
    const alpha = clamp(localProgress * 1.8, 0, 1)
    return {
        offset: (1 - eased) * layout.fontSize * 0.88,
        alpha,
    }
}

export function drawCoverTitle(context, imageData, markup, options = {}) {
    const layout = layoutCoverTitle(context, markup, imageData.width, imageData.height, options)
    if (!layout) return

    const theme = getTheme(options.themeStyle)
    const smallestRunSize = Math.min(
        ...layout.runs.filter((run) => run.text.trim()).map((run) => run.fontSize)
    )
    const targetContrast = smallestRunSize >= 24 ? LARGE_TITLE_MIN_CONTRAST : TITLE_MIN_CONTRAST
    const analysisBounds = expandRect(
        layout.textRect,
        imageData.width,
        imageData.height,
        layout.fontSize * 0.15
    )
    let stabilizedRegion = null
    let stabilizedOrigin = { x: 0, y: 0 }
    let blockSamples = sampleRegion(imageData, analysisBounds)
    let baseForeground = chooseTextColor(blockSamples.values, options, theme, targetContrast)
    const bestBlockContrast = scoreForeground(blockSamples.values, baseForeground)
    if (blockSamples.stdDev > 0.12 && bestBlockContrast < Math.min(targetContrast, 3.6)) {
        const strength = Math.min(0.12, Math.max(0.05, blockSamples.stdDev * 0.36))
        stabilizedRegion = stabilizeTitleRegion(context, analysisBounds, strength)
        if (stabilizedRegion) {
            stabilizedOrigin = { x: analysisBounds.left, y: analysisBounds.top }
            blockSamples = sampleRegion(
                stabilizedRegion,
                analysisBounds,
                stabilizedOrigin.x,
                stabilizedOrigin.y
            )
            baseForeground = chooseTextColor(blockSamples.values, options, theme, targetContrast)
        }
    }

    const baseForegroundHex = colorToHex(baseForeground)
    for (const run of layout.runs) {
        run.style.paint.foreground = run.solidId === null ? baseForegroundHex : SOLID_FOREGROUND
    }

    const sampleForRect = (rect) =>
        sampleRegion(stabilizedRegion || imageData, rect, stabilizedOrigin.x, stabilizedOrigin.y)
            .values
    const solidColors = new Map()

    for (const rect of layout.solidRects) {
        const solidPaint = chooseSolidPaint(theme)
        solidColors.set(rect.solidId, solidPaint)
        const motion = getWordMotion(layout, rect.wordIndex, options)
        const animated = motion.offset !== 0 || motion.alpha !== 1
        context.save()
        if (animated) {
            context.translate(0, motion.offset)
            context.globalAlpha = motion.alpha
        }
        context.fillStyle = colorToHex(solidPaint.backgroundColor)
        roundedRect(context, rect)
        context.restore()
    }

    const accentGroups = new Map()
    for (const run of layout.runs) {
        if (run.accentId === null || !run.text.trim()) continue
        const key = getAccentGroupKey(run)
        let group = accentGroups.get(key)
        if (!group) {
            group = {
                left: Number.POSITIVE_INFINITY,
                top: Number.POSITIVE_INFINITY,
                right: Number.NEGATIVE_INFINITY,
                bottom: Number.NEGATIVE_INFINITY,
                samples: [],
                runs: [],
            }
            accentGroups.set(key, group)
        }
        group.left = Math.min(group.left, run.x)
        group.top = Math.min(group.top, run.y)
        group.right = Math.max(group.right, run.x + run.width)
        group.bottom = Math.max(group.bottom, run.y + run.height)
        const solidColor = run.solidId === null ? null : solidColors.get(run.solidId)
        group.samples.push(
            ...(solidColor
                ? [relativeLuminance(...solidColor.backgroundColor)]
                : sampleForRect({
                      left: run.x,
                      top: run.y,
                      width: Math.max(1, run.width),
                      height: Math.max(1, run.height),
                  }))
        )
        group.runs.push(run)
    }

    const accentFills = new Map()
    for (const [key, group] of accentGroups) {
        const gradientColors = adjustGradientForContrast(group.samples, theme.accentGradient)
        const gradient = createAccentGradient(
            context,
            {
                left: group.left,
                top: group.top,
                right: group.right,
                bottom: group.bottom,
            },
            gradientColors
        )
        accentFills.set(key, { gradient, representative: gradientColors[1] })
    }

    for (const run of layout.runs) {
        if (!run.text.trim()) continue
        const accentFill = run.accentId === null ? null : accentFills.get(getAccentGroupKey(run))
        const solidColor = run.solidId === null ? null : solidColors.get(run.solidId)
        const textColor = solidColor?.foreground || baseForeground
        const paintedColor = accentFill?.representative || textColor
        const samples = solidColor
            ? [relativeLuminance(...solidColor.backgroundColor)]
            : sampleForRect({
                  left: run.x,
                  top: run.y,
                  width: Math.max(1, run.width),
                  height: Math.max(1, run.height),
              })
        const contrast = minimumContrast(samples, paintedColor)
        const shadowAlpha = contrast >= 4.5 ? 0 : 0.04
        const shadowRgb = relativeLuminance(...paintedColor) > 0.5 ? '0, 0, 0' : '255, 255, 255'
        const motion = getWordMotion(layout, run.wordIndex, options)
        const animated = motion.offset !== 0 || motion.alpha !== 1

        context.save()
        if (animated) {
            context.translate(0, motion.offset)
            context.globalAlpha = motion.alpha
        }
        context.font = `${run.fontWeight} ${run.fontSize}px ${run.fontFamily}`
        context.letterSpacing = `${run.letterSpacing}px`
        context.textAlign = 'left'
        context.textBaseline = 'alphabetic'
        context.fillStyle = accentFill?.gradient || colorToHex(textColor)
        context.shadowColor = `rgba(${shadowRgb}, ${shadowAlpha})`
        context.shadowBlur = shadowAlpha ? 4 : 0
        context.shadowOffsetY = shadowAlpha ? 1 : 0
        context.fillText(run.text, run.x, run.baseline)
        context.restore()
    }
}
