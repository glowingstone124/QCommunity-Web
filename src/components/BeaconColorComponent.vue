<script setup>
import { computed, ref } from 'vue'

const GLASS_COLORS = [
	{ key: 'white', label: '白色', hex: '#f9fffe', rgb: [249, 255, 254] },
	{ key: 'orange', label: '橙色', hex: '#f9801d', rgb: [249, 128, 29] },
	{ key: 'magenta', label: '品红色', hex: '#c74ebd', rgb: [199, 78, 189] },
	{ key: 'light_blue', label: '淡蓝色', hex: '#3ab3da', rgb: [58, 179, 218] },
	{ key: 'yellow', label: '黄色', hex: '#fed83d', rgb: [254, 216, 61] },
	{ key: 'lime', label: '黄绿色', hex: '#80c71f', rgb: [128, 199, 31] },
	{ key: 'pink', label: '粉红色', hex: '#f38baa', rgb: [243, 139, 170] },
	{ key: 'gray', label: '灰色', hex: '#474f52', rgb: [71, 79, 82] },
	{ key: 'light_gray', label: '淡灰色', hex: '#9d9d97', rgb: [157, 157, 151] },
	{ key: 'cyan', label: '青色', hex: '#169c9c', rgb: [22, 156, 156] },
	{ key: 'purple', label: '紫色', hex: '#8932b8', rgb: [137, 50, 184] },
	{ key: 'blue', label: '蓝色', hex: '#3c44aa', rgb: [60, 68, 170] },
	{ key: 'brown', label: '棕色', hex: '#835432', rgb: [131, 84, 50] },
	{ key: 'green', label: '绿色', hex: '#5e7c16', rgb: [94, 124, 22] },
	{ key: 'red', label: '红色', hex: '#b02e26', rgb: [176, 46, 38] },
	{ key: 'black', label: '黑色', hex: '#1d1d21', rgb: [29, 29, 33] },
]

const targetColor = ref('#f9fffe')
const sequenceLength = ref(3)
const result = ref(calculateBestSequence(hexToRgb(targetColor.value), sequenceLength.value))

const normalizedColor = computed({
	get() {
		return targetColor.value
	},
	set(value) {
		const cleanValue = value.startsWith('#') ? value : `#${value}`
		targetColor.value = cleanValue.slice(0, 7)
	},
})

function hexToRgb(hex) {
	const normalized = hex.replace('#', '').padEnd(6, '0').slice(0, 6)
	return [
		Number.parseInt(normalized.slice(0, 2), 16),
		Number.parseInt(normalized.slice(2, 4), 16),
		Number.parseInt(normalized.slice(4, 6), 16),
	]
}

function rgbToHex(rgb) {
	return `#${rgb.map((value) => Math.round(value).toString(16).padStart(2, '0')).join('')}`
}

function mixBeamColor(currentColor, nextColor) {
	if (!currentColor) return nextColor
	return currentColor.map((value, index) => Math.floor((value + nextColor[index]) / 2))
}

function distance(a, b) {
	return Math.sqrt(
		((a[0] - b[0]) ** 2) +
		((a[1] - b[1]) ** 2) +
		((a[2] - b[2]) ** 2)
	)
}

function calculateBestSequence(targetRgb, maxLength) {
	let best = {
		colors: [GLASS_COLORS[0]],
		rgb: GLASS_COLORS[0].rgb,
		error: distance(GLASS_COLORS[0].rgb, targetRgb),
	}

	function visit(depth, currentRgb, colors) {
		if (colors.length > 0) {
			const error = distance(currentRgb, targetRgb)
			if (error < best.error) {
				best = { colors: [...colors], rgb: [...currentRgb], error }
			}
		}

		if (depth >= maxLength) return

		for (const glassColor of GLASS_COLORS) {
			visit(depth + 1, mixBeamColor(currentRgb, glassColor.rgb), [...colors, glassColor])
		}
	}

	visit(0, null, [])
	return best
}

function calculate() {
	result.value = calculateBestSequence(hexToRgb(targetColor.value), sequenceLength.value)
}
</script>

<template>
	<section class="beacon-panel">
		<header class="tool-header">
			<div>
				<h2>信标颜色转换</h2>
			</div>
			<span class="edition-badge">Java only</span>
		</header>

		<div class="control-panel">
			<label class="field">
				<span>目标颜色</span>
				<div class="color-row">
					<input v-model="targetColor" type="color" class="color-picker" />
					<input v-model="normalizedColor" type="text" class="text-input" spellcheck="false" />
				</div>
			</label>

			<label class="field">
				<span>最大玻璃层数</span>
				<select v-model.number="sequenceLength" class="text-input">
					<option :value="1">1 层</option>
					<option :value="2">2 层</option>
					<option :value="3">3 层</option>
					<option :value="4">4 层</option>
				</select>
			</label>

			<button type="button" class="primary-button" @click="calculate">计算序列</button>
		</div>

		<div class="result-grid">
			<div class="result-card">
				<span>近似颜色</span>
				<strong>{{ rgbToHex(result.rgb) }}</strong>
				<div class="color-preview" :style="{ backgroundColor: rgbToHex(result.rgb) }"></div>
			</div>
			<div class="result-card">
				<span>误差</span>
				<strong>{{ result.error.toFixed(2) }}</strong>
				<p>数值越小越接近目标颜色。</p>
			</div>
		</div>

		<div class="sequence-panel">
			<div class="section-head">
				<h3>玻璃序列</h3>
				<span>{{ result.colors.length }} 层</span>
			</div>
			<div class="glass-list">
				<div v-for="(color, index) in result.colors" :key="`${color.key}-${index}`" class="glass-item">
					<div class="swatch" :style="{ backgroundColor: color.hex }"></div>
					<div>
						<strong>{{ index + 1 }}. {{ color.label }}</strong>
						<span>{{ color.hex }}</span>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<style scoped>
.beacon-panel {
	--tool-border: var(--border-soft, var(--split));
	display: flex;
	flex-direction: column;
	gap: 1rem;
	width: 100%;
	max-width: 1180px;
	margin: 0 auto;
	color: var(--text-main);
}

.tool-header,
.control-panel,
.result-card,
.sequence-panel {
	border: 1px solid var(--tool-border);
	background: var(--background);
	padding: 1rem;
}

.tool-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
}

.tool-header h2 {
	margin: 0;
	color: var(--title-color);
	font-size: clamp(1.25rem, 1.8vw, 1.65rem);
	line-height: 1.2;
}

.tool-header p {
	margin: 0.32rem 0 0;
	color: var(--text-secondary);
	line-height: 1.5;
}

.edition-badge {
	border: 1px solid var(--primary);
	color: var(--primary);
	padding: 0.35rem 0.58rem;
	font-size: 0.82rem;
	font-weight: 800;
	white-space: nowrap;
}

.control-panel {
	display: grid;
	grid-template-columns: minmax(220px, 1fr) minmax(180px, 240px) auto;
	align-items: end;
	gap: 1rem;
}

.field {
	display: grid;
	gap: 0.42rem;
	min-width: 0;
}

.field span,
.result-card span,
.glass-item span {
	color: var(--text-secondary);
	font-size: 0.86rem;
}

.color-row {
	display: grid;
	grid-template-columns: 48px minmax(0, 1fr);
	gap: 0.5rem;
}

.color-picker,
.text-input {
	width: 100%;
	height: 42px;
	box-sizing: border-box;
	border: 1px solid var(--tool-border);
	background: var(--background-secondary);
	color: var(--text-main);
	border-radius: 0;
}

.color-picker {
	padding: 0.25rem;
}

.text-input {
	padding: 0 0.75rem;
	font: inherit;
}

.text-input:focus,
.color-picker:focus {
	outline: none;
	border-color: var(--primary);
}

.primary-button {
	height: 42px;
	border: 1px solid var(--primary);
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
	padding: 0 1rem;
	font-weight: 800;
	cursor: pointer;
	white-space: nowrap;
}

.primary-button:hover {
	background: var(--button-primary-hover);
}

.result-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 1rem;
}

.result-card {
	display: grid;
	gap: 0.45rem;
	min-width: 0;
}

.result-card strong {
	color: var(--text-main);
	font-size: 1.15rem;
	overflow-wrap: anywhere;
}

.result-card p {
	margin: 0;
	color: var(--text-secondary);
	line-height: 1.5;
}

.color-preview {
	height: 34px;
	border: 1px solid var(--tool-border);
}

.section-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 1rem;
	padding-bottom: 0.8rem;
	border-bottom: 1px solid var(--tool-border);
}

.section-head h3 {
	margin: 0;
	color: var(--title-color);
	font-size: 1rem;
}

.section-head span {
	color: var(--text-secondary);
	font-weight: 700;
}

.glass-list {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 0.65rem;
	padding-top: 0.9rem;
}

.glass-item {
	display: grid;
	grid-template-columns: 34px minmax(0, 1fr);
	align-items: center;
	gap: 0.75rem;
	border: 1px solid var(--tool-border);
	background: var(--background-secondary);
	padding: 0.72rem;
}

.glass-item strong {
	display: block;
	color: var(--text-main);
	margin-bottom: 0.14rem;
}

.swatch {
	width: 34px;
	height: 34px;
	border: 1px solid var(--tool-border);
}

@media (max-width: 900px) {
	.control-panel {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 640px) {
	.tool-header {
		flex-direction: column;
	}

	.result-grid {
		grid-template-columns: 1fr;
	}

	.primary-button {
		width: 100%;
	}
}
</style>
