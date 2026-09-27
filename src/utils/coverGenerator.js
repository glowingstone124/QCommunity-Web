function hexToRgb(hex) {
    return [
        Number.parseInt(hex.slice(1, 3), 16),
        Number.parseInt(hex.slice(3, 5), 16),
        Number.parseInt(hex.slice(5, 7), 16),
    ]
}

const PALETTES = Object.freeze({
    blue: {
        base: hexToRgb('#EFF1F6'),
        colors: {
            primary: [hexToRgb('#557CB8'), hexToRgb('#4D83B8')],
            secondary: [hexToRgb('#53B6C5'), hexToRgb('#6AB7C3')],
            accent: [hexToRgb('#7DB49A'), hexToRgb('#7EA7CF')],
            deep: [hexToRgb('#294B77'), hexToRgb('#31526F')],
            highlight: [hexToRgb('#F7F5F1'), hexToRgb('#EAF4F4')],
        },
        baseWeight: 0.3,
        fields: 5,
        grain: 1.7,
        saturation: 0.79,
        contrast: 1.08,
    },
    cyan: {
        base: hexToRgb('#EFF5F4'),
        colors: {
            primary: [hexToRgb('#45A7B7'), hexToRgb('#3999B1')],
            secondary: [hexToRgb('#5A79B7'), hexToRgb('#668AC0')],
            accent: [hexToRgb('#82BFA3'), hexToRgb('#8EC8C3')],
            deep: [hexToRgb('#24546E'), hexToRgb('#2D5674')],
            highlight: [hexToRgb('#F5F8F5'), hexToRgb('#E9F1F1')],
        },
        baseWeight: 0.3,
        fields: 5,
        grain: 1.7,
        saturation: 0.78,
        contrast: 1.08,
    },
    green: {
        base: hexToRgb('#F1EFDE'),
        colors: {
            primary: [hexToRgb('#B8D96B'), hexToRgb('#9EC84D')],
            secondary: [hexToRgb('#82CC83'), hexToRgb('#69BE8E')],
            accent: [hexToRgb('#74C5C6'), hexToRgb('#55AFC1')],
            deep: [hexToRgb('#3C6558'), hexToRgb('#31596A')],
            highlight: [hexToRgb('#DDE9A8'), hexToRgb('#F3F2DD')],
        },
        baseWeight: 0.3,
        fields: 5,
        grain: 1.7,
        saturation: 0.79,
        contrast: 1.08,
    },
    violet: {
        base: hexToRgb('#F2EFF6'),
        colors: {
            primary: [hexToRgb('#7D75B5'), hexToRgb('#896FB0')],
            secondary: [hexToRgb('#577FB8'), hexToRgb('#5D8AC0')],
            accent: [hexToRgb('#61AFC0'), hexToRgb('#79BFC2')],
            deep: [hexToRgb('#44446D'), hexToRgb('#414B78')],
            highlight: [hexToRgb('#F6EFF4'), hexToRgb('#F0F1F5')],
        },
        baseWeight: 0.3,
        fields: 5,
        grain: 1.7,
        saturation: 0.79,
        contrast: 1.08,
    },
    orange: {
        base: hexToRgb('#F5EEE2'),
        colors: {
            primary: [hexToRgb('#D87840'), hexToRgb('#D5684B')],
            secondary: [hexToRgb('#D1A84C'), hexToRgb('#E0B85D')],
            accent: [hexToRgb('#B95F53'), hexToRgb('#C77A69')],
            deep: [hexToRgb('#754638'), hexToRgb('#795348')],
            highlight: [hexToRgb('#F8EBDD'), hexToRgb('#F6E5C8')],
        },
        baseWeight: 0.3,
        fields: 5,
        grain: 1.7,
        saturation: 0.77,
        contrast: 1.08,
    },
})

export const COVER_STYLES = Object.freeze(Object.keys(PALETTES))
export const MIN_COVER_DIMENSION = 64
export const MAX_COVER_DIMENSION = 8192
export const MAX_COVER_PIXELS = 34_000_000
const COVER_COMPOSITIONS = Object.freeze([
    'diagonal',
    'corner_glow',
    'split',
    'edge_light',
    'cross_field',
])

export function createCoverSeed() {
    const values = new Uint32Array(2)
    if (globalThis.crypto?.getRandomValues) {
        globalThis.crypto.getRandomValues(values)
    } else {
        values[0] = Math.floor(Math.random() * 0x1_0000_0000)
        values[1] = (Date.now() ^ Math.floor(Math.random() * 0x1_0000_0000)) >>> 0
    }

    return Array.from(values, (value) => value.toString(16).padStart(8, '0')).join('')
}

export function isValidCoverDimensions(width, height) {
    return (
        Number.isInteger(width) &&
        Number.isInteger(height) &&
        width >= MIN_COVER_DIMENSION &&
        height >= MIN_COVER_DIMENSION &&
        width <= MAX_COVER_DIMENSION &&
        height <= MAX_COVER_DIMENSION &&
        width * height <= MAX_COVER_PIXELS
    )
}

function stableHash(value) {
    let hash = 2166136261
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index)
        hash = Math.imul(hash, 16777619)
    }

    hash ^= hash >>> 16
    hash = Math.imul(hash, 0x7feb352d)
    hash ^= hash >>> 15
    hash = Math.imul(hash, 0x846ca68b)
    hash ^= hash >>> 16
    return hash >>> 0
}

function createRandom(initialSeed) {
    let state = initialSeed >>> 0
    return () => {
        state += 0x6d2b79f5
        let value = state
        value = Math.imul(value ^ (value >>> 15), value | 1)
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
        return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000
    }
}

function createSeededRandom(style, seed, width, height) {
    return createRandom(stableHash(`${seed}\u0000${style}\u0000${width}\u0000${height}`))
}

function chooseComposition(random) {
    return COVER_COMPOSITIONS[Math.floor(random() * COVER_COMPOSITIONS.length)]
}

function validateCoverRequest(width, height, style) {
    if (!isValidCoverDimensions(width, height)) {
        throw new RangeError('Image dimensions are outside the supported range.')
    }
    if (!Object.prototype.hasOwnProperty.call(PALETTES, style)) {
        throw new RangeError(`Unknown cover style: ${style}`)
    }
}

export function getCoverComposition(style, seed, width, height) {
    validateCoverRequest(width, height, style)
    return chooseComposition(createSeededRandom(style, seed, width, height))
}

function mixColor(first, second, amount) {
    return [
        first[0] + (second[0] - first[0]) * amount,
        first[1] + (second[1] - first[1]) * amount,
        first[2] + (second[2] - first[2]) * amount,
    ]
}

function chooseRoleColor(palette, role, random) {
    const colors = palette.colors[role] || palette.colors.primary
    return colors[Math.min(colors.length - 1, Math.floor(random() * colors.length))]
}

function pointAt(x, y, aspect) {
    return { x: (x - 0.5) * aspect, y: y - 0.5 }
}

function createCompositionLayout(composition, random, aspect) {
    const mirror = random() < 0.5 ? -1 : 1
    let anchors
    let fieldAngles
    let lightAnchor
    let darkAnchor

    switch (composition) {
        case 'corner_glow': {
            const cornerX = random() < 0.5 ? 0.12 : 0.88
            const cornerY = random() < 0.5 ? 0.12 : 0.88
            const opposite = pointAt(1 - cornerX, 1 - cornerY, aspect)
            anchors = [
                pointAt(cornerX, cornerY, aspect),
                pointAt(cornerX === 0.12 ? 0.28 : 0.72, cornerY === 0.12 ? 0.27 : 0.73, aspect),
                opposite,
                pointAt(0.5, 0.5, aspect),
            ]
            fieldAngles = [Math.PI / 4, -Math.PI / 4]
            lightAnchor = anchors[0]
            darkAnchor = opposite
            break
        }
        case 'split': {
            const normalAngle = [0, Math.PI / 2, Math.PI / 4, (Math.PI * 3) / 4][
                Math.floor(random() * 4)
            ]
            const normalX = Math.cos(normalAngle)
            const normalY = Math.sin(normalAngle)
            const distance = aspect * (0.28 + random() * 0.14)
            const first = { x: normalX * distance, y: normalY * distance }
            const second = { x: -first.x, y: -first.y }
            anchors = [
                first,
                second,
                { x: first.x * 0.62, y: first.y * 0.62 },
                { x: second.x * 0.7, y: second.y * 0.7 },
            ]
            fieldAngles = [normalAngle + Math.PI / 2, normalAngle + Math.PI / 2 + 0.25]
            lightAnchor = first
            darkAnchor = second
            break
        }
        case 'edge_light': {
            const edge = Math.floor(random() * 4)
            const edgePoints = [
                [pointAt(-0.12, 0.5, aspect), pointAt(0.17, 0.24, aspect)],
                [pointAt(1.12, 0.5, aspect), pointAt(0.83, 0.76, aspect)],
                [pointAt(0.5, -0.12, aspect), pointAt(0.25, 0.18, aspect)],
                [pointAt(0.5, 1.12, aspect), pointAt(0.75, 0.82, aspect)],
            ]
            anchors = [
                ...edgePoints[edge],
                pointAt(
                    edge < 2 ? (edge === 0 ? 0.82 : 0.18) : 0.5,
                    edge < 2 ? 0.5 : edge === 2 ? 0.82 : 0.18,
                    aspect
                ),
                pointAt(0.5, 0.5, aspect),
            ]
            fieldAngles = edge < 2 ? [Math.PI / 2, Math.PI / 2 + 0.3] : [0.3, -0.3]
            lightAnchor = anchors[0]
            darkAnchor = anchors[2]
            break
        }
        case 'cross_field':
            anchors = [
                pointAt(0.18, 0.18, aspect),
                pointAt(0.82, 0.82, aspect),
                pointAt(0.82, 0.18, aspect),
                pointAt(0.18, 0.82, aspect),
                pointAt(0.5, 0.5, aspect),
            ]
            fieldAngles = [Math.PI / 4, -Math.PI / 4]
            lightAnchor = pointAt(0.5, 0.5, aspect)
            darkAnchor = anchors[1]
            break
        default: {
            const startX = mirror > 0 ? 0.12 : 0.88
            const endX = 1 - startX
            anchors = [
                pointAt(startX, 0.82, aspect),
                pointAt(endX, 0.18, aspect),
                pointAt(mirror > 0 ? 0.34 : 0.66, 0.64, aspect),
                pointAt(mirror > 0 ? 0.66 : 0.34, 0.34, aspect),
            ]
            fieldAngles = [(mirror * Math.PI) / 4, (-mirror * Math.PI) / 4]
            lightAnchor = anchors[0]
            darkAnchor = anchors[1]
        }
    }

    return { anchors, fieldAngles, lightAnchor, darkAnchor }
}

function randomLightAngle(random, alternate = false) {
    if (alternate) return (Math.PI * (105 + random() * 55)) / 180
    return (Math.PI * (20 + random() * 55)) / 180
}

function createFields(palette, random, aspect, composition) {
    const layout = createCompositionLayout(composition, random, aspect)
    const fieldCount = Math.max(4, Math.min(7, palette.fields - 1 + Math.floor(random() * 4)))
    const roles = ['primary', 'secondary', 'primary', 'accent', 'deep', 'secondary', 'accent']
    const roleColors = Object.fromEntries(
        ['primary', 'secondary', 'accent', 'deep', 'highlight'].map((role) => [
            role,
            chooseRoleColor(palette, role, random),
        ])
    )
    const strengthRanges = {
        primary: [1.0, 1.28],
        secondary: [0.68, 0.92],
        accent: [0.3, 0.5],
        deep: [0.4, 0.58],
    }
    const fields = Array.from({ length: fieldCount }, (_, index) => {
        const role = roles[index]
        const anchor = layout.anchors[index % layout.anchors.length]
        const angle =
            layout.fieldAngles[index % layout.fieldAngles.length] + (random() - 0.5) * 0.64
        const [minimumStrength, maximumStrength] = strengthRanges[role]
        const jitterX = composition === 'split' ? 0.12 : 0.56
        const jitterY = composition === 'split' ? 0.16 : 0.56
        return {
            centerX: anchor.x + (random() - 0.5) * aspect * jitterX,
            centerY: anchor.y + (random() - 0.5) * jitterY,
            sigmaX: aspect * (0.3 + random() * 0.58),
            sigmaY: 0.3 + random() * 0.72,
            cosine: Math.cos(angle),
            sine: Math.sin(angle),
            intensity: minimumStrength + random() * (maximumStrength - minimumStrength),
            color: roleColors[role],
        }
    })

    const lightCount = 1 + Math.floor(random() * 3)
    const lights = Array.from({ length: lightCount }, (_, index) => {
        const angle = randomLightAngle(random, index % 2 === 1)
        const normalX = Math.cos(angle)
        const normalY = Math.sin(angle)
        const sigma = aspect * (0.08 + random() * 0.2)
        const span = (Math.abs(normalX) * aspect) / 2 + Math.abs(normalY) / 2 + sigma
        const anchor = layout.lightAnchor
        const offset =
            composition === 'corner_glow' || composition === 'edge_light'
                ? -(normalX * anchor.x + normalY * anchor.y) + (random() - 0.5) * sigma * 1.4
                : (random() - 0.5) * 2 * span
        return {
            normalX,
            normalY,
            offset,
            sigma,
            intensity: 0.16 + random() * 0.21,
            color: mixColor(roleColors.highlight, roleColors.accent, random() * 0.16),
        }
    })

    const darkRoll = random()
    const darkCount = darkRoll < 0.05 ? 0 : darkRoll < 0.52 ? 1 : 2
    const darkFields = Array.from({ length: darkCount }, (_, index) => {
        const kind = random() < 0.58 ? 'gaussian' : 'directional'
        const anchor = layout.darkAnchor
        if (kind === 'gaussian') {
            const angle = random() * Math.PI
            return {
                kind,
                centerX: anchor.x + (random() - 0.5) * aspect * 0.3,
                centerY: anchor.y + (random() - 0.5) * 0.4,
                sigmaX: aspect * (0.36 + random() * 0.5),
                sigmaY: 0.32 + random() * 0.68,
                cosine: Math.cos(angle),
                sine: Math.sin(angle),
                strength: 0.22 + random() * 0.12,
            }
        }

        const angle = randomLightAngle(random, index % 2 === 1)
        const normalX = Math.cos(angle)
        const normalY = Math.sin(angle)
        return {
            kind,
            normalX,
            normalY,
            offset: -(normalX * anchor.x + normalY * anchor.y),
            sigma: aspect * (0.08 + random() * 0.2),
            strength: 0.2 + random() * 0.12,
        }
    })

    return { fields, lights, darkFields }
}

export function generateCoverBackground(width, height, style, seed) {
    validateCoverRequest(width, height, style)
    const palette = PALETTES[style]
    const random = createSeededRandom(style, seed, width, height)
    const composition = chooseComposition(random)
    const { fields, lights, darkFields } = createFields(
        palette,
        random,
        width / height,
        composition
    )
    const data = new Uint8ClampedArray(width * height * 4)

    for (let y = 0; y < height; y += 1) {
        const normalizedY = (y + 0.5 - height / 2) / height
        for (let x = 0; x < width; x += 1) {
            const normalizedX = (x + 0.5 - width / 2) / height
            let red = palette.base[0] * palette.baseWeight
            let green = palette.base[1] * palette.baseWeight
            let blue = palette.base[2] * palette.baseWeight
            let totalWeight = palette.baseWeight

            for (const field of fields) {
                const deltaX = normalizedX - field.centerX
                const deltaY = normalizedY - field.centerY
                const rotatedX = field.cosine * deltaX + field.sine * deltaY
                const rotatedY = -field.sine * deltaX + field.cosine * deltaY
                const exponent =
                    -0.5 * ((rotatedX / field.sigmaX) ** 2 + (rotatedY / field.sigmaY) ** 2)
                const weight = Math.exp(Math.max(exponent, -60)) * field.intensity
                red += field.color[0] * weight
                green += field.color[1] * weight
                blue += field.color[2] * weight
                totalWeight += weight
            }

            red /= totalWeight
            green /= totalWeight
            blue /= totalWeight

            let darkness = 0
            for (const field of darkFields) {
                let weight
                if (field.kind === 'gaussian') {
                    const deltaX = normalizedX - field.centerX
                    const deltaY = normalizedY - field.centerY
                    const rotatedX = field.cosine * deltaX + field.sine * deltaY
                    const rotatedY = -field.sine * deltaX + field.cosine * deltaY
                    const exponent =
                        -0.5 * ((rotatedX / field.sigmaX) ** 2 + (rotatedY / field.sigmaY) ** 2)
                    weight = Math.exp(Math.max(exponent, -60)) * field.strength
                } else {
                    const distance =
                        field.normalX * normalizedX + field.normalY * normalizedY + field.offset
                    weight = Math.exp(-0.5 * (distance / field.sigma) ** 2) * field.strength
                }
                darkness = 1 - (1 - darkness) * (1 - weight)
            }
            const darkening = 1 - Math.min(0.58, darkness)
            red *= darkening
            green *= darkening
            blue *= darkening

            for (const light of lights) {
                const distance =
                    light.normalX * normalizedX + light.normalY * normalizedY + light.offset
                const weight = Math.exp(-0.5 * (distance / light.sigma) ** 2) * light.intensity
                red += (light.color[0] - red) * weight
                green += (light.color[1] - green) * weight
                blue += (light.color[2] - blue) * weight
            }

            const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722
            const grain = (random() + random() + random() - 1.5) * 2 * palette.grain
            const redTone =
                softClip(
                    127.5 +
                        (luminance + (red - luminance) * palette.saturation - 127.5) *
                            palette.contrast
                ) + grain
            const greenTone =
                softClip(
                    127.5 +
                        (luminance + (green - luminance) * palette.saturation - 127.5) *
                            palette.contrast
                ) + grain
            const blueTone =
                softClip(
                    127.5 +
                        (luminance + (blue - luminance) * palette.saturation - 127.5) *
                            palette.contrast
                ) + grain
            const offset = (y * width + x) * 4
            data[offset] = Math.max(8, Math.min(248, redTone))
            data[offset + 1] = Math.max(8, Math.min(248, greenTone))
            data[offset + 2] = Math.max(8, Math.min(248, blueTone))
            data[offset + 3] = 255
        }
    }

    return new ImageData(data, width, height)
}

function softClip(channel) {
    const centered = channel - 127.5
    return 127.5 + centered / (1 + (Math.abs(centered) / 127.5) * 0.12)
}
