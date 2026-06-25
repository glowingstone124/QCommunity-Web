<template>
	<section class="cover-tool">
		<form class="cover-controls" @submit.prevent="renderCover">
			<label class="field">
				<span>标题</span>
				<textarea
					v-model="title"
					rows="3"
					placeholder="输入新闻或指南标题"
					@input="renderCover"
				></textarea>
			</label>

			<div class="control-grid">
				<label class="field">
					<span>种子</span>
					<input v-model="seed" type="text" placeholder="留空使用标题" @input="renderCover">
				</label>

				<label class="field">
					<span>主题</span>
					<select v-model="theme" @change="renderCover">
						<option value="dark">深色</option>
						<option value="light">浅色</option>
					</select>
				</label>

				<label class="field">
					<span>布局</span>
					<select v-model="layout" @change="renderCover">
						<option value="left">左下</option>
						<option value="center">居中</option>
						<option value="right">右下</option>
					</select>
				</label>
			</div>

			<div class="actions">
				<button type="button" class="button secondary" @click="shuffleSeed">换一张</button>
				<button type="button" class="button primary" @click="downloadCover">下载 PNG</button>
			</div>
		</form>

		<div class="preview-shell">
			<canvas ref="canvasRef" class="cover-canvas" width="1600" height="900"></canvas>
		</div>
	</section>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'

const canvasRef = ref(null)
const title = ref('Quantum Original 官方网站视觉更新')
const seed = ref('')
const theme = ref('dark')
const layout = ref('left')

function hashString(value) {
	let hash = 2166136261

	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index)
		hash = Math.imul(hash, 16777619)
	}

	return hash >>> 0
}

function createRandom(initialSeed) {
	let state = initialSeed || 1

	return () => {
		state += 0x6d2b79f5
		let value = state
		value = Math.imul(value ^ (value >>> 15), value | 1)
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296
	}
}

function hsl(h, s, l, alpha = 1) {
	return `hsla(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}% / ${alpha})`
}

function wrapText(ctx, text, maxWidth, maxLines) {
	const source = text.trim() || 'Untitled'
	const hasSpaces = /\s/.test(source)
	const tokens = hasSpaces ? source.split(/\s+/) : Array.from(source)
	const lines = []
	let line = ''

	for (const token of tokens) {
		const nextLine = hasSpaces
			? line ? `${line} ${token}` : token
			: `${line}${token}`

		if (ctx.measureText(nextLine).width <= maxWidth || !line) {
			line = nextLine
			continue
		}

		lines.push(line)
		line = token

		if (lines.length === maxLines - 1) {
			break
		}
	}

	if (line && lines.length < maxLines) {
		lines.push(line)
	}

	return lines
}

function drawBackground(ctx, random, palette, isDark) {
	const width = ctx.canvas.width
	const height = ctx.canvas.height
	const base = ctx.createLinearGradient(0, 0, width, height)
	base.addColorStop(0, palette.baseA)
	base.addColorStop(0.52, palette.baseB)
	base.addColorStop(1, palette.baseC)
	ctx.fillStyle = base
	ctx.fillRect(0, 0, width, height)

	ctx.globalCompositeOperation = isDark ? 'screen' : 'multiply'
	for (let index = 0; index < 22; index += 1) {
		const x = random() * width
		const y = random() * height
		const radius = (0.16 + random() * 0.32) * width
		const hue = palette.hues[index % palette.hues.length] + random() * 18 - 9
		const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
		gradient.addColorStop(0, hsl(hue, 78, isDark ? 58 : 54, isDark ? 0.28 : 0.16))
		gradient.addColorStop(0.56, hsl(hue + 12, 70, isDark ? 38 : 62, isDark ? 0.08 : 0.07))
		gradient.addColorStop(1, hsl(hue, 70, 45, 0))
		ctx.fillStyle = gradient
		ctx.beginPath()
		ctx.arc(x, y, radius, 0, Math.PI * 2)
		ctx.fill()
	}

	ctx.globalCompositeOperation = 'source-over'
	ctx.lineWidth = 1
	for (let index = 0; index < 90; index += 1) {
		const startX = random() * width
		const startY = random() * height
		const length = 120 + random() * 420
		const angle = random() * Math.PI * 2
		const hue = palette.hues[index % palette.hues.length]
		ctx.strokeStyle = hsl(hue, 80, isDark ? 74 : 38, isDark ? 0.13 : 0.1)
		ctx.beginPath()
		ctx.moveTo(startX, startY)
		ctx.lineTo(startX + Math.cos(angle) * length, startY + Math.sin(angle) * length)
		ctx.stroke()
	}

	const vignette = ctx.createRadialGradient(width * 0.5, height * 0.5, height * 0.25, width * 0.5, height * 0.5, width * 0.72)
	vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
	vignette.addColorStop(1, isDark ? 'rgba(0, 0, 0, 0.42)' : 'rgba(255, 255, 255, 0.36)')
	ctx.fillStyle = vignette
	ctx.fillRect(0, 0, width, height)

	ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.035)' : 'rgba(8, 16, 32, 0.028)'
	for (let index = 0; index < 4800; index += 1) {
		ctx.fillRect(random() * width, random() * height, 1, 1)
	}
}

function drawTitle(ctx, palette, isDark) {
	const width = ctx.canvas.width
	const height = ctx.canvas.height
	const maxTextWidth = layout.value === 'center' ? width * 0.74 : width * 0.58
	let fontSize = 76
	let lines = []

	while (fontSize > 38) {
		ctx.font = `700 ${fontSize}px "Space Grotesk", "PingFang SC", sans-serif`
		lines = wrapText(ctx, title.value, maxTextWidth, 3)

		if (lines.every((line) => ctx.measureText(line).width <= maxTextWidth)) {
			break
		}

		fontSize -= 6
	}

	const lineHeight = fontSize * 1.08
	const blockHeight = lines.length * lineHeight
	const x = layout.value === 'center'
		? width / 2
		: layout.value === 'right'
			? width - 130
			: 130
	const y = layout.value === 'center'
		? height / 2 - blockHeight / 2 + fontSize * 0.76
		: height - 170 - blockHeight + fontSize

	ctx.textAlign = layout.value === 'center' ? 'center' : layout.value === 'right' ? 'right' : 'left'
	ctx.textBaseline = 'alphabetic'

	ctx.font = `700 ${fontSize}px "Space Grotesk", "PingFang SC", sans-serif`
	ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.7)'
	ctx.shadowBlur = 14
	ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a'
	lines.forEach((line, index) => {
		ctx.fillText(line, x, y + index * lineHeight)
	})
}

function createPalette(hash, isDark) {
	const hueA = hash % 360
	const hueB = (hueA + 42 + (hash % 54)) % 360
	const hueC = (hueA + 180 + (hash % 38)) % 360

	return {
		hues: [hueA, hueB, hueC],
		baseA: isDark ? hsl(hueA, 54, 8, 1) : hsl(hueA, 42, 92, 1),
		baseB: isDark ? hsl(hueB, 48, 13, 1) : hsl(hueB, 54, 86, 1),
		baseC: isDark ? hsl(hueC, 44, 7, 1) : hsl(hueC, 38, 95, 1),
	}
}

async function renderCover() {
	await nextTick()
	const canvas = canvasRef.value

	if (!canvas) {
		return
	}

	const ctx = canvas.getContext('2d')
	const source = `${title.value}|${seed.value || title.value}|${theme.value}|${layout.value}`
	const hash = hashString(source)
	const random = createRandom(hash)
	const isDark = theme.value === 'dark'
	const palette = createPalette(hash, isDark)

	ctx.clearRect(0, 0, canvas.width, canvas.height)
	drawBackground(ctx, random, palette, isDark)
	drawTitle(ctx, palette, isDark)
}

function shuffleSeed() {
	seed.value = Math.random().toString(36).slice(2, 9)
	renderCover()
}

function downloadCover() {
	const canvas = canvasRef.value

	if (!canvas) {
		return
	}

	const link = document.createElement('a')
	const safeTitle = (title.value || 'cover').trim().replace(/[^\w\u4e00-\u9fa5-]+/g, '-').slice(0, 40) || 'cover'
	link.download = `${safeTitle}.png`
	link.href = canvas.toDataURL('image/png')
	link.click()
}

onMounted(renderCover)
watch([title, seed, theme, layout], renderCover)
</script>

<style scoped>
.cover-tool {
	display: grid;
	grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
	gap: 1rem;
	align-items: start;
}

.cover-controls,
.preview-shell {
	border: 1px solid var(--misc-border, var(--split));
	background: color-mix(in srgb, var(--background) 82%, transparent);
}

.cover-controls {
	display: grid;
	gap: 1rem;
	padding: 1rem;
}

.field {
	display: grid;
	gap: 0.45rem;
	color: var(--text-main);
}

.field span {
	color: var(--text-secondary);
	font-size: 0.86rem;
	font-weight: 720;
}

.field input,
.field textarea,
.field select {
	width: 100%;
	border: 1px solid var(--misc-border, var(--split));
	background: var(--background);
	color: var(--text-main);
	padding: 0.72rem 0.8rem;
	box-sizing: border-box;
	resize: vertical;
	outline: none;
}

.field input:focus,
.field textarea:focus,
.field select:focus {
	border-color: var(--primary);
}

.control-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.85rem;
}

.actions {
	display: flex;
	gap: 0.75rem;
	flex-wrap: wrap;
}

.button {
	border: 1px solid var(--misc-border, var(--split));
	padding: 0.72rem 1rem;
	cursor: pointer;
	font-weight: 720;
}

.button.primary {
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
	border-color: var(--button-primary-bg);
}

.button.secondary {
	background: transparent;
	color: var(--text-main);
}

.button:hover,
.button:focus-visible {
	border-color: var(--primary);
	outline: none;
}

.preview-shell {
	padding: 1rem;
}

.cover-canvas {
	width: 100%;
	aspect-ratio: 16 / 9;
	display: block;
	background: var(--code-bg);
}

@media (max-width: 980px) {
	.cover-tool {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 640px) {
	.control-grid {
		grid-template-columns: 1fr;
	}
}
</style>
