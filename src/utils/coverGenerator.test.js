import assert from 'node:assert/strict'
import test from 'node:test'

import {
    COVER_STYLES,
    generateCoverBackground,
    getCoverComposition,
    isValidCoverDimensions,
} from './coverGenerator.js'

if (!globalThis.ImageData) {
    globalThis.ImageData = class ImageData {
        constructor(data, width, height) {
            this.data = data
            this.width = width
            this.height = height
        }
    }
}

test('cover output and composition are stable for a style, seed, and size', () => {
    for (const style of COVER_STYLES) {
        const first = generateCoverBackground(128, 72, style, 'stable-example-seed')
        const repeated = generateCoverBackground(128, 72, style, 'stable-example-seed')
        assert.equal(
            getCoverComposition(style, 'stable-example-seed', 128, 72),
            getCoverComposition(style, 'stable-example-seed', 128, 72)
        )
        assert.deepEqual(repeated.data, first.data)
    }
})

test('different seeds change composition and generated pixels', () => {
    const seeds = ['aurora-21', 'field-104', 'drift-7', 'vector-630', 'quiet-88']
    for (const style of COVER_STYLES) {
        const compositions = new Set(seeds.map((seed) => getCoverComposition(style, seed, 128, 72)))
        const images = seeds.map((seed) =>
            Buffer.from(generateCoverBackground(128, 72, style, seed).data).toString('base64')
        )
        assert.ok(compositions.size > 1, `${style} should vary composition across seeds`)
        assert.equal(
            new Set(images).size,
            seeds.length,
            `${style} should render each seed differently`
        )
    }
})

test('cover dimensions retain their safety bounds', () => {
    assert.equal(isValidCoverDimensions(2560, 1440), true)
    assert.equal(isValidCoverDimensions(3840, 2160), true)
    assert.equal(isValidCoverDimensions(7680, 4320), true)
    assert.equal(isValidCoverDimensions(63, 630), false)
    assert.equal(isValidCoverDimensions(8193, 2160), false)
    assert.equal(isValidCoverDimensions(8192, 8192), false)
})

test('4K background generation returns full-resolution pixels', () => {
    const image = generateCoverBackground(3840, 2160, 'blue', '4k-cover')
    assert.equal(image.width, 3840)
    assert.equal(image.height, 2160)
    assert.equal(image.data.length, 3840 * 2160 * 4)
})
