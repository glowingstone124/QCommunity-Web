import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
    COVER_STYLES,
    generateCoverBackground,
    getCoverComposition,
} from '../src/utils/coverGenerator.js'

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDirectory = path.join(rootDirectory, 'examples')
const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'qhub-cover-examples-'))
const width = 1200
const height = 630
const seeds = ['aurora-21', 'field-104', 'drift-7', 'vector-630', 'quiet-88']
const entries = []

if (!globalThis.ImageData) {
    globalThis.ImageData = class ImageData {
        constructor(data, imageWidth, imageHeight) {
            this.data = data
            this.width = imageWidth
            this.height = imageHeight
        }
    }
}

try {
    await mkdir(outputDirectory, { recursive: true })

    for (const style of COVER_STYLES) {
        for (const [index, seed] of seeds.entries()) {
            const image = generateCoverBackground(width, height, style, seed)
            const rgb = Buffer.allocUnsafe(width * height * 3)
            for (let source = 0, destination = 0; source < image.data.length; source += 4) {
                rgb[destination] = image.data[source]
                rgb[destination + 1] = image.data[source + 1]
                rgb[destination + 2] = image.data[source + 2]
                destination += 3
            }

            const fileName = `${style}-${String(index + 1).padStart(2, '0')}.webp`
            const rawPath = path.join(temporaryDirectory, `${style}-${index + 1}.rgb`)
            await writeFile(rawPath, rgb)
            entries.push({
                style,
                seed,
                composition: getCoverComposition(style, seed, width, height),
                fileName,
                rawPath,
            })
        }
    }

    const titleSamples = [
        {
            entry: entries[0],
            fileName: 'title-english-short.webp',
            title: 'Powering K2',
            variant: 'short English',
        },
        {
            entry: entries[7],
            fileName: 'title-english-long.webp',
            title: 'Research Begins Where Order Meets the Unknown',
            variant: 'long English',
        },
        {
            entry: entries[12],
            fileName: 'title-chinese.webp',
            title: '在未知边界，寻找新的秩序',
            variant: 'Chinese',
        },
        {
            entry: entries[18],
            fileName: 'title-mixed.webp',
            title: 'Research in Color\n让复杂结构清晰可见',
            variant: 'mixed',
        },
        {
            entry: entries[22],
            fileName: 'title-multiline.webp',
            title: 'Signals from the field\nA softer view of science\n让色彩形成空间',
            variant: 'multiline',
        },
        {
            entry: entries[4],
            fileName: 'title-custom-color.webp',
            title: 'A brighter point of view',
            variant: 'custom color',
            color: '#A34EB1',
        },
    ]

    const richTitleSamples = [
        {
            fileName: 'rich-title-01.webp',
            style: 'blue',
            seed: 'rich-blue-01',
            titleMarkup:
                '<title>Build Apps Using</title>\n<newline/>\n<subtitle><solid>Kotshi AI</solid></subtitle>',
            variant: 'title + solid subtitle',
        },
        {
            fileName: 'rich-title-02.webp',
            style: 'cyan',
            seed: 'rich-cyan-02',
            titleMarkup: '<title>Build <solid>Apps</solid> Using AI</title>',
            variant: 'inline solid span',
        },
        {
            fileName: 'rich-title-03.webp',
            style: 'green',
            seed: 'rich-green-03',
            titleMarkup: '<title>Hello</title> <subtitle>World</subtitle>',
            variant: 'mixed-size baseline',
        },
        {
            fileName: 'rich-title-cn.webp',
            style: 'violet',
            seed: 'rich-violet-cn',
            titleMarkup:
                '<title>中文标题</title>\n<newline/>\n<subtitle><solid>第二行</solid></subtitle>',
            variant: 'Chinese title + solid subtitle',
        },
        {
            fileName: 'theme-blue.webp',
            style: 'blue',
            seed: 'theme-blue-cover',
            titleMarkup:
                '<title>Build Apps Using</title>\n<newline/>\n<subtitle><solid>Kotshi AI</solid></subtitle>',
            variant: 'blue theme foreground + solid',
        },
        {
            fileName: 'theme-green.webp',
            style: 'green',
            seed: 'theme-green-cover',
            titleMarkup:
                '<title>Build Apps Using</title>\n<newline/>\n<subtitle><solid>Kotshi AI</solid></subtitle>',
            variant: 'green theme foreground + solid',
        },
        {
            fileName: 'theme-violet.webp',
            style: 'violet',
            seed: 'theme-violet-cover',
            titleMarkup:
                '<title>Build Apps Using</title>\n<newline/>\n<subtitle><solid>Kotshi AI</solid></subtitle>',
            variant: 'violet theme foreground + solid',
        },
        {
            fileName: 'theme-orange.webp',
            style: 'orange',
            seed: 'theme-orange-cover',
            titleMarkup:
                '<title>Build Apps Using</title>\n<newline/>\n<subtitle><solid>Kotshi AI</solid></subtitle>',
            variant: 'orange theme foreground + solid',
        },
        {
            fileName: 'accent.webp',
            style: 'blue',
            seed: 'accent-blue-cover',
            titleMarkup: '<title>Powered by <accent>AI</accent></title>',
            variant: 'blue accent gradient',
        },
        {
            fileName: 'solid-accent.webp',
            style: 'cyan',
            seed: 'solid-accent-cyan-cover',
            titleMarkup: '<title>Powered by <solid><accent>AI</accent></solid></title>',
            variant: 'cyan solid + accent gradient',
        },
    ].map((sample) => ({
        ...sample,
        composition: getCoverComposition(sample.style, sample.seed, width, height),
    }))

    const manifestPath = path.join(temporaryDirectory, 'manifest.json')
    await writeFile(
        manifestPath,
        JSON.stringify({
            width,
            height,
            outputDirectory,
            entries,
            titleSamples,
            richTitleSamples,
        })
    )

    execFileSync(
        'python3',
        [path.join(rootDirectory, 'scripts', 'build-cover-contact-sheet.py'), manifestPath],
        { stdio: 'inherit' }
    )
} finally {
    await rm(temporaryDirectory, { recursive: true, force: true })
}
