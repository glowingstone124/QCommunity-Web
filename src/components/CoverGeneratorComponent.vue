<template>
    <section class="cover-panel">
        <header class="tool-header">
            <div>
                <h2>{{ t('coverPage.heading') }}</h2>
                <p>{{ t('coverPage.description') }}</p>
            </div>
            <span class="local-badge">{{ t('coverPage.localBadge') }}</span>
        </header>

        <div class="generator-grid">
            <section class="preview-panel" :aria-label="t('coverPage.preview')">
                <header class="preview-header">
                    <h3>{{ t('coverPage.preview') }}</h3>
                    <span>{{ previewDimensions }}</span>
                </header>
                <div class="preview-frame">
                    <canvas
                        ref="canvasRef"
                        class="cover-canvas"
                        :width="DEFAULT_COVER_WIDTH"
                        :height="DEFAULT_COVER_HEIGHT"
                        :style="{ aspectRatio: canvasAspectRatio }"
                        :aria-label="
                            t('coverPage.previewAlt', {
                                width: previewWidth,
                                height: previewHeight,
                            })
                        "
                        role="img"
                    ></canvas>
                </div>
                <p class="preview-caption" aria-live="polite">
                    {{ t('coverPage.seedCaption', { seed: effectiveSeed }) }}
                </p>
                <div v-if="videoPreviewUrl" class="video-preview">
                    <video
                        class="video-preview-player"
                        :src="videoPreviewUrl"
                        controls
                        autoplay
                        loop
                        muted
                        playsinline
                        :aria-label="t('coverPage.videoPreviewAlt')"
                    ></video>
                    <div class="video-preview-footer">
                        <span>{{ videoPreviewFormat.toUpperCase() }}</span>
                        <button type="button" class="secondary-button" @click="downloadVideo">
                            {{ t('coverPage.downloadVideo') }}
                        </button>
                    </div>
                </div>
                <p v-if="renderError || downloadError" class="error-state" role="alert">
                    {{ renderError || downloadError }}
                </p>
                <p v-if="videoError" class="error-state" role="alert">{{ videoError }}</p>
            </section>

            <div class="control-panel">
                <label class="field">
                    <span>{{ t('coverPage.titleLabel') }}</span>
                    <textarea
                        v-model="title"
                        rows="3"
                        maxlength="240"
                        :aria-invalid="Boolean(titleMarkupError)"
                        aria-describedby="cover-title-markup-help"
                        :placeholder="t('coverPage.titleHint')"
                    ></textarea>
                </label>

                <div class="title-markup-help">
                    <small id="cover-title-markup-help">{{ t('coverPage.titleMarkupHelp') }}</small>
                    <button
                        type="button"
                        class="title-example-button"
                        @click="insertRichTitleExample"
                    >
                        {{ t('coverPage.titleMarkupExample') }}
                    </button>
                </div>
                <p v-if="titleMarkupError" class="title-markup-error" role="alert">
                    {{
                        t('coverPage.titleMarkupError', {
                            line: titleMarkupError.line,
                            column: titleMarkupError.column,
                            message: titleMarkupError.message,
                        })
                    }}
                </p>

                <label class="field">
                    <span>{{ t('coverPage.titleSize') }}</span>
                    <input
                        v-model.lazy.number="titleFontSize"
                        type="number"
                        :min="MIN_TITLE_FONT_SIZE"
                        :max="MAX_TITLE_FONT_SIZE"
                        step="1"
                    />
                </label>

                <label class="field">
                    <span>{{ t('coverPage.titleColor') }}</span>
                    <select v-model="titleColorMode">
                        <option value="auto">{{ t('coverPage.titleColorAuto') }}</option>
                        <option value="dark">{{ t('coverPage.titleColorDark') }}</option>
                        <option value="light">{{ t('coverPage.titleColorLight') }}</option>
                        <option value="custom">{{ t('coverPage.titleColorCustom') }}</option>
                    </select>
                </label>

                <label v-if="titleColorMode === 'custom'" class="field">
                    <span>{{ t('coverPage.customTitleColor') }}</span>
                    <input v-model="titleColor" type="color" />
                </label>

                <h3 class="control-section-heading">{{ t('coverPage.backgroundSettings') }}</h3>

                <label class="field">
                    <span>{{ t('coverPage.seedLabel') }}</span>
                    <input
                        v-model="seed"
                        type="text"
                        maxlength="80"
                        spellcheck="false"
                        :placeholder="t('coverPage.seedHint')"
                    />
                </label>

                <fieldset class="style-picker">
                    <legend>{{ t('coverPage.style') }}</legend>
                    <div class="style-options">
                        <label
                            v-for="coverStyle in COVER_STYLES"
                            :key="coverStyle"
                            class="style-option"
                        >
                            <input
                                v-model="style"
                                type="radio"
                                name="cover-style"
                                :value="coverStyle"
                            />
                            <span class="style-option-face">
                                <span
                                    class="style-swatch"
                                    :class="`style-swatch--${coverStyle}`"
                                    aria-hidden="true"
                                ></span>
                                <span>{{ t(`coverPage.${coverStyle}`) }}</span>
                            </span>
                        </label>
                    </div>
                </fieldset>

                <h3 class="control-section-heading">{{ t('coverPage.exportSettings') }}</h3>

                <div class="size-grid">
                    <label class="field">
                        <span>{{ t('coverPage.width') }}</span>
                        <input
                            v-model.number="width"
                            type="number"
                            min="64"
                            :max="MAX_COVER_DIMENSION"
                            step="1"
                        />
                    </label>
                    <label class="field">
                        <span>{{ t('coverPage.height') }}</span>
                        <input
                            v-model.number="height"
                            type="number"
                            min="64"
                            :max="MAX_COVER_DIMENSION"
                            step="1"
                        />
                    </label>
                </div>

                <label class="field">
                    <span>{{ t('coverPage.format') }}</span>
                    <select v-model="format">
                        <option value="webp">{{ t('coverPage.webp') }}</option>
                        <option value="png">{{ t('coverPage.png') }}</option>
                    </select>
                </label>

                <p class="size-hint">{{ t('coverPage.sizeHint') }}</p>

                <h3 class="control-section-heading">{{ t('coverPage.videoSettings') }}</h3>

                <div class="size-grid">
                    <label class="field">
                        <span>{{ t('coverPage.videoDuration') }}</span>
                        <input
                            v-model.number="videoDuration"
                            type="number"
                            min="2"
                            max="12"
                            step="0.5"
                        />
                    </label>
                    <label class="field">
                        <span>{{ t('coverPage.videoFps') }}</span>
                        <select v-model.number="videoFps">
                            <option :value="24">24</option>
                            <option :value="30">30</option>
                            <option :value="60">60</option>
                        </select>
                    </label>
                </div>

                <div class="size-grid">
                    <label class="field">
                        <span>{{ t('coverPage.lightAngle') }}</span>
                        <input
                            v-model.number="lightAngle"
                            type="number"
                            min="0"
                            max="360"
                            step="1"
                        />
                    </label>
                    <label class="field">
                        <span>{{ t('coverPage.lightSweep') }}</span>
                        <input
                            v-model.number="lightSweep"
                            type="number"
                            min="0"
                            max="360"
                            step="1"
                        />
                    </label>
                </div>

                <label class="field">
                    <span>{{ t('coverPage.videoFormat') }}</span>
                    <select v-model="videoFormat">
                        <option value="webm">WebM</option>
                        <option value="mp4">MP4</option>
                        <option value="mov">MOV</option>
                    </select>
                </label>

                <label class="field range-field">
                    <span>
                        {{ t('coverPage.wordAnimationSpeed') }}
                        <output>{{ Number(animationSpeed).toFixed(1) }}×</output>
                    </span>
                    <input
                        v-model.number="animationSpeed"
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                    />
                </label>

                <p class="size-hint">{{ t('coverPage.videoHint') }}</p>

                <div class="actions">
                    <button type="button" class="secondary-button" @click="randomizeSeed">
                        {{ t('coverPage.randomSeed') }}
                    </button>
                    <button
                        type="button"
                        class="primary-button"
                        :disabled="!canDownload"
                        @click="downloadCover"
                    >
                        {{ t('coverPage.downloadAction') }}
                    </button>
                    <button
                        type="button"
                        class="primary-button video-button"
                        :disabled="!canGenerateVideo || isRecording"
                        @click="generateVideo"
                    >
                        {{ isRecording ? t('coverPage.videoGenerating', { progress: videoPercent }) : t('coverPage.generateVideo') }}
                    </button>
                </div>
                <progress
                    v-if="isRecording"
                    class="video-progress"
                    :value="videoProgress"
                    max="1"
                    :aria-label="t('coverPage.videoProgress', { progress: videoPercent })"
                ></progress>
            </div>
        </div>
    </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
    COVER_STYLES,
    MAX_COVER_DIMENSION,
    createCoverSeed,
    generateCoverBackground,
    isValidCoverDimensions,
} from '@/utils/coverGenerator.js'
import { drawCoverTitle } from '@/utils/coverTitle.js'
import { parseCoverTitleMarkup, resolveCoverTitleRuns } from '@/utils/coverTitleMarkup.js'

const canvasRef = ref(null)
const DEFAULT_COVER_WIDTH = 2560
const DEFAULT_COVER_HEIGHT = 1440
const MIN_TITLE_FONT_SIZE = 16
const MAX_TITLE_FONT_SIZE = 1024
const { t } = useI18n()
const title = ref('')
const titleDocument = ref(parseCoverTitleMarkup(''))
const titleMarkupError = ref(null)
const titleFontSize = ref(208)
const titleColorMode = ref('auto')
const titleColor = ref('#173A59')
const seed = ref(createCoverSeed())
const style = ref('blue')
const width = ref(DEFAULT_COVER_WIDTH)
const height = ref(DEFAULT_COVER_HEIGHT)
const format = ref('webp')
const videoDuration = ref(4)
const videoFps = ref(24)
const videoFormat = ref('webm')
const lightAngle = ref(35)
const lightSweep = ref(180)
const animationSpeed = ref(1.5)
const renderError = ref('')
const downloadError = ref('')
const videoError = ref('')
const isRecording = ref(false)
const videoProgress = ref(0)
const videoPreviewUrl = ref('')
const videoPreviewFormat = ref('webm')
let backgroundImageData = null
let backgroundKey = ''
let renderTimer = null
let forceBackgroundOnNextRender = false
let activeVideoRecorder = null
let activeVideoStream = null
let videoPreviewObjectUrl = ''

const effectiveSeed = computed(() => seed.value.trim() || 'cover')

function getDimensions() {
    const imageWidth = Number(width.value)
    const imageHeight = Number(height.value)
    if (!isValidCoverDimensions(imageWidth, imageHeight)) return null
    return { width: imageWidth, height: imageHeight }
}

function getTitleFontSize() {
    const fontSize = Number(titleFontSize.value)
    return Number.isInteger(fontSize) &&
        fontSize >= MIN_TITLE_FONT_SIZE &&
        fontSize <= MAX_TITLE_FONT_SIZE
        ? fontSize
        : null
}

const canDownload = computed(
    () =>
        Boolean(getDimensions()) &&
        getTitleFontSize() !== null &&
        !renderError.value &&
        !titleMarkupError.value
)
const canGenerateVideo = computed(
    () =>
        canDownload.value &&
        Number.isFinite(Number(videoDuration.value)) &&
        Number(videoDuration.value) >= 2 &&
        Number(videoDuration.value) <= 12 &&
        [24, 30, 60].includes(Number(videoFps.value)) &&
        ['webm', 'mp4', 'mov'].includes(videoFormat.value) &&
        Number.isFinite(Number(lightAngle.value)) &&
        Number(lightAngle.value) >= 0 &&
        Number(lightAngle.value) <= 360 &&
        Number.isFinite(Number(lightSweep.value)) &&
        Number(lightSweep.value) >= 0 &&
        Number(lightSweep.value) <= 360 &&
        Number.isFinite(Number(animationSpeed.value)) &&
        Number(animationSpeed.value) >= 0.5 &&
        Number(animationSpeed.value) <= 3
)
const videoPercent = computed(() => `${Math.round(videoProgress.value * 100)}%`)
const previewWidth = computed(() => getDimensions()?.width ?? '—')
const previewHeight = computed(() => getDimensions()?.height ?? '—')
const previewDimensions = computed(() => `${previewWidth.value} × ${previewHeight.value}`)
const canvasAspectRatio = computed(() => {
    const dimensions = getDimensions()
    return dimensions ? `${dimensions.width} / ${dimensions.height}` : '16 / 9'
})

function scheduleRender(regenerateBackground = false) {
    if (regenerateBackground) forceBackgroundOnNextRender = true
    if (renderTimer !== null) clearTimeout(renderTimer)
    renderTimer = setTimeout(() => {
        renderTimer = null
        const regenerate = forceBackgroundOnNextRender
        forceBackgroundOnNextRender = false
        renderCover(regenerate)
    }, 120)
}

function renderCover(regenerateBackground = false) {
    if (titleMarkupError.value) return

    const dimensions = getDimensions()
    if (!dimensions) {
        renderError.value = t('coverPage.sizeError')
        return
    }
    const fontSize = getTitleFontSize()
    if (fontSize === null) {
        renderError.value = t('coverPage.fontSizeError')
        return
    }

    const canvas = canvasRef.value
    if (!canvas) return

    try {
        const { width: imageWidth, height: imageHeight } = dimensions
        const cacheKey = `${effectiveSeed.value}\u0000${style.value}\u0000${imageWidth}\u0000${imageHeight}`
        const needsBackground =
            regenerateBackground || !backgroundImageData || backgroundKey !== cacheKey
        if (needsBackground) {
            backgroundImageData = generateCoverBackground(
                imageWidth,
                imageHeight,
                style.value,
                effectiveSeed.value
            )
            backgroundKey = cacheKey
        }

        if (canvas.width !== imageWidth) canvas.width = imageWidth
        if (canvas.height !== imageHeight) canvas.height = imageHeight
        const context = canvas.getContext('2d', { alpha: false })
        if (!context) throw new Error(t('coverPage.canvasUnavailable'))
        context.putImageData(backgroundImageData, 0, 0)
        drawCoverTitle(context, backgroundImageData, titleDocument.value, {
            fontSize,
            colorMode: titleColorMode.value,
            textColor: titleColor.value,
            themeStyle: style.value,
        })
        renderError.value = ''
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        renderError.value = t('coverPage.renderError', { message })
    }
}

function drawDynamicLight(context, width, height, angle) {
    const radians = ((angle - 90) * Math.PI) / 180
    const distance = Math.hypot(width, height) * 0.62
    const centerX = width / 2 + Math.cos(radians) * distance
    const centerY = height / 2 + Math.sin(radians) * distance
    const radius = Math.hypot(width, height) * 0.9
    const light = context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
    )
    light.addColorStop(0, 'rgba(255, 255, 255, 0.22)')
    light.addColorStop(0.28, 'rgba(255, 255, 255, 0.09)')
    light.addColorStop(0.72, 'rgba(255, 255, 255, 0.015)')
    light.addColorStop(1, 'rgba(255, 255, 255, 0)')

    const shadowAngle = radians + Math.PI
    const shadowX = width / 2 + Math.cos(shadowAngle) * distance * 0.72
    const shadowY = height / 2 + Math.sin(shadowAngle) * distance * 0.72
    const shadow = context.createLinearGradient(shadowX, shadowY, centerX, centerY)
    shadow.addColorStop(0, 'rgba(0, 0, 0, 0.16)')
    shadow.addColorStop(0.48, 'rgba(0, 0, 0, 0.035)')
    shadow.addColorStop(1, 'rgba(0, 0, 0, 0)')

    context.save()
    context.globalCompositeOperation = 'screen'
    context.fillStyle = light
    context.fillRect(0, 0, width, height)
    context.globalCompositeOperation = 'multiply'
    context.fillStyle = shadow
    context.fillRect(0, 0, width, height)
    context.restore()
}

function getVideoMimeType(formatName) {
    if (
        typeof MediaRecorder === 'undefined' ||
        typeof MediaRecorder.isTypeSupported !== 'function'
    )
        return ''
    const candidates = {
        webm: ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'],
        mp4: ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4'],
        mov: ['video/quicktime;codecs=h264', 'video/quicktime'],
    }[formatName]
    if (!candidates) return ''
    return candidates.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || ''
}

function setVideoPreview(blob, formatName) {
    if (videoPreviewObjectUrl) URL.revokeObjectURL(videoPreviewObjectUrl)
    videoPreviewObjectUrl = URL.createObjectURL(blob)
    videoPreviewUrl.value = videoPreviewObjectUrl
    videoPreviewFormat.value = formatName
}

function downloadVideo() {
    if (!videoPreviewUrl.value) return
    const link = document.createElement('a')
    link.href = videoPreviewUrl.value
    link.download = `${safeFileName()}.${videoPreviewFormat.value}`
    document.body.append(link)
    link.click()
    link.remove()
}

async function generateVideo() {
    videoError.value = ''
    videoProgress.value = 0
    if (!canGenerateVideo.value) return

    const dimensions = getDimensions()
    const fontSize = getTitleFontSize()
    const mimeType = getVideoMimeType(videoFormat.value)
    if (!dimensions || fontSize === null) return

    if (!mimeType) {
        videoError.value = t('coverPage.videoUnsupported')
        return
    }
    if (typeof HTMLCanvasElement === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
        videoError.value = t('coverPage.videoUnsupported')
        return
    }

    renderCover(false)
    if (renderError.value || !backgroundImageData) return

    const recordingCanvas = document.createElement('canvas')
    recordingCanvas.width = dimensions.width
    recordingCanvas.height = dimensions.height
    const context = recordingCanvas.getContext('2d', { alpha: false })
    if (!context) {
        videoError.value = t('coverPage.canvasUnavailable')
        return
    }

    const duration = Number(videoDuration.value)
    const fps = Number(videoFps.value)
    const frameInterval = 1000 / fps
    const baseAngle = Number(lightAngle.value)
    const sweep = Number(lightSweep.value)
    const stream = recordingCanvas.captureStream(fps)
    const recorder = new MediaRecorder(stream, { mimeType })
    const chunks = []
    activeVideoRecorder = recorder
    activeVideoStream = stream
    isRecording.value = true

    const recordingComplete = new Promise((resolve, reject) => {
        recorder.addEventListener('dataavailable', (event) => {
            if (event.data?.size) chunks.push(event.data)
        })
        recorder.addEventListener('error', () => reject(new Error(t('coverPage.videoRecordError'))), {
            once: true,
        })
        recorder.addEventListener(
            'stop',
            () => resolve(new Blob(chunks, { type: mimeType.split(';', 1)[0] })),
            { once: true }
        )
    })

    try {
        recorder.start()
        const startedAt = performance.now()
        let nextFrameAt = startedAt
        await new Promise((resolve) => {
            const drawNextFrame = (now) => {
                const elapsed = Math.min(duration * 1000, Math.max(0, now - startedAt))
                const progress = duration ? elapsed / (duration * 1000) : 1
                const angle = baseAngle + Math.sin(progress * Math.PI * 2) * (sweep / 2)
                context.putImageData(backgroundImageData, 0, 0)
                drawDynamicLight(context, dimensions.width, dimensions.height, angle)
                drawCoverTitle(context, backgroundImageData, titleDocument.value, {
                    fontSize,
                    colorMode: titleColorMode.value,
                    textColor: titleColor.value,
                    themeStyle: style.value,
                    animationProgress: progress,
                    wordDuration: 0.44 / Number(animationSpeed.value),
                    wordStagger: 0.12 / Number(animationSpeed.value),
                })
                videoProgress.value = progress
                if (progress >= 1) {
                    recorder.stop()
                    resolve()
                    return
                }
                nextFrameAt += frameInterval
                window.setTimeout(() => drawNextFrame(performance.now()), Math.max(0, nextFrameAt - performance.now()))
            }
            drawNextFrame(startedAt)
        })

        const blob = await recordingComplete
        if (!blob.size) throw new Error(t('coverPage.videoRecordError'))
        setVideoPreview(blob, videoFormat.value)
    } catch (error) {
        if (recorder.state !== 'inactive') recorder.stop()
        const message = error instanceof Error ? error.message : String(error)
        videoError.value = t('coverPage.videoError', { message })
    } finally {
        stream.getTracks().forEach((track) => track.stop())
        activeVideoRecorder = null
        activeVideoStream = null
        isRecording.value = false
        videoProgress.value = 0
        renderCover(false)
    }
}

function randomizeSeed() {
    seed.value = createCoverSeed()
}

function insertRichTitleExample() {
    title.value = [
        '<subtitle><solid>KOTSHI AI</solid></subtitle>',
        '<newline/>',
        '<title>Build Apps Using</title>',
        '<newline/>',
        '<title>Powered by <accent>AI</accent></title>',
    ].join('\n')
}

function safeFileName() {
    const source = title.value.trim() || `cover-${effectiveSeed.value}`
    return (
        source
            .replace(/[\s\\/:*?"<>|]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 64) || 'cover'
    )
}

async function downloadCover() {
    downloadError.value = ''
    if (titleMarkupError.value) return
    if (!getDimensions()) {
        renderError.value = t('coverPage.sizeError')
        return
    }
    renderCover(false)
    if (renderError.value) return

    const canvas = canvasRef.value
    if (!canvas) return

    const mimeType = format.value === 'png' ? 'image/png' : 'image/webp'
    let objectUrl = ''
    try {
        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob(
                (result) =>
                    result
                        ? resolve(result)
                        : reject(new Error('The browser returned an empty image.')),
                mimeType,
                format.value === 'webp' ? 0.94 : undefined
            )
        })
        if (blob.type.toLowerCase() !== mimeType) {
            throw new Error(t('coverPage.formatUnsupported'))
        }

        const downloadUrl = URL.createObjectURL(blob)
        objectUrl = downloadUrl
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = `${safeFileName()}.${format.value}`
        document.body.append(link)
        link.click()
        link.remove()
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
        objectUrl = ''
        downloadError.value = ''
    } catch (error) {
        if (objectUrl) URL.revokeObjectURL(objectUrl)
        const message = error instanceof Error ? error.message : String(error)
        downloadError.value = t('coverPage.downloadError', { message })
    }
}

watch(
    [seed, style, width, height],
    () => {
        downloadError.value = ''
        scheduleRender(true)
    },
    { flush: 'post' }
)
watch(
    title,
    () => {
        downloadError.value = ''
        try {
            const document = parseCoverTitleMarkup(title.value)
            resolveCoverTitleRuns(document)
            titleDocument.value = document
            titleMarkupError.value = null
            scheduleRender(false)
        } catch (error) {
            titleMarkupError.value = {
                line: Number.isInteger(error?.line) ? error.line : 1,
                column: Number.isInteger(error?.column) ? error.column : 1,
                message: error instanceof Error ? error.message : String(error),
            }
        }
    },
    { flush: 'post' }
)
watch(
    [titleFontSize, titleColorMode, titleColor],
    () => {
        downloadError.value = ''
        scheduleRender(false)
    },
    { flush: 'post' }
)
watch(format, () => {
    downloadError.value = ''
})
watch([videoDuration, videoFps, videoFormat, lightAngle, lightSweep, animationSpeed], () => {
    videoError.value = ''
})
onMounted(() => renderCover(true))
onBeforeUnmount(() => {
    if (renderTimer !== null) clearTimeout(renderTimer)
    if (activeVideoRecorder && activeVideoRecorder.state !== 'inactive') activeVideoRecorder.stop()
    activeVideoStream?.getTracks().forEach((track) => track.stop())
    if (videoPreviewObjectUrl) URL.revokeObjectURL(videoPreviewObjectUrl)
})
</script>

<style scoped src="./CoverGeneratorComponent.css"></style>
