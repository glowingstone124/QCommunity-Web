<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
	qpluginTabs,
	quickSteps,
	serverHighlights,
	serverLandmarks,
	serverMetrics,
	serverModes,
	serverScenes,
	serverSpecs,
} from '@/data/server.js'

const { locale, t } = useI18n()
const router = useRouter()
const copyStatus = ref('')
const activeQPluginTabId = ref('mechanics')
const activeSceneIndex = ref(0)
const tickerPaused = ref(false)
const isPinned = ref(false)
const wipeKey = ref(0)
const displayMetrics = ref(serverMetrics.map((metric) => metric.value))

const rootEl = ref(null)
const stageEl = ref(null)
const pinEl = ref(null)
const metricsEl = ref(null)
const layerEls = ref([])

let copyTimer = 0
let scrollerEl = null
let scrollFrame = 0
let metricsFrame = 0
let resizeObserver = null
let metricsObserver = null
let lastStageProgress = -1
let lastSceneFraction = -1

const sceneCount = serverScenes.length
const SCENE_SPAN_RATIO = 0.75

const activeQPluginTab = computed(() => {
	return qpluginTabs.find((tab) => tab.id === activeQPluginTabId.value) || qpluginTabs[0]
})

const heroWords = computed(() => t('serverPage.heroTitle').split(' ').filter(Boolean))
const domainChars = computed(() => Array.from(serverSpecs.domain))

const tickerItems = computed(() => [
	serverSpecs.version,
	serverSpecs.maxRailSpeed,
	t('serverPage.specs.authDesc'),
	'QPlugin',
	'20.0 TPS',
	t('serverPage.badgeVanillaSpec'),
	t('serverPage.badgeRelaySync'),
	t('serverPage.survivalName'),
])

// Deterministic voxel skyline: a column height per block, no randomness so SSR/HMR stay stable.
const skyline = Array.from({ length: 28 }, (_, index) => {
	const wave = Math.abs(Math.sin(index * 0.62) * Math.cos(index * 0.27))
	const height = 14 + Math.round(wave * 58) + ((index * 7) % 5) * 3
	return { id: index, height, delay: ((index * 53) % 17) * 55 }
})

function layerState(index) {
	if (index === activeSceneIndex.value) return 'is-active'
	return index < activeSceneIndex.value ? 'is-past' : 'is-next'
}

function setLayerRef(element, index) {
	if (element) layerEls.value[index] = element
}

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value))
}

function stageGeometry() {
	if (!stageEl.value || !pinEl.value) return null
	const viewport = scrollerEl ? scrollerEl.getBoundingClientRect().top : 0
	const top = stageEl.value.getBoundingClientRect().top - viewport
	const total = Math.max(1, stageEl.value.offsetHeight - pinEl.value.offsetHeight)
	return { scrolled: clamp(-top, 0, total), total }
}

function updateStage() {
	scrollFrame = 0

	// Stacked layout (small screens): chapters are plain sections, so follow whichever one is nearest the top.
	if (!isPinned.value) {
		const viewportTop = scrollerEl ? scrollerEl.getBoundingClientRect().top : 0
		const threshold = viewportTop + window.innerHeight * 0.35
		let nearest = 0
		layerEls.value.forEach((element, index) => {
			if (element && element.getBoundingClientRect().top <= threshold) nearest = index
		})
		if (nearest !== activeSceneIndex.value) activeSceneIndex.value = nearest
		return
	}

	const geometry = stageGeometry()
	if (!geometry || !pinEl.value) return

	const progress = geometry.scrolled / geometry.total
	const scaled = progress * sceneCount
	const index = clamp(Math.floor(scaled), 0, sceneCount - 1)
	const fraction = clamp(scaled - index, 0, 1)

	if (index !== activeSceneIndex.value) activeSceneIndex.value = index
	if (Math.abs(progress - lastStageProgress) > 0.0015) {
		lastStageProgress = progress
		pinEl.value.style.setProperty('--stage-p', progress.toFixed(4))
	}
	if (Math.abs(fraction - lastSceneFraction) > 0.003) {
		lastSceneFraction = fraction
		pinEl.value.style.setProperty('--scene-f', fraction.toFixed(4))
	}
}

function requestStageUpdate() {
	if (scrollFrame) return
	scrollFrame = requestAnimationFrame(updateStage)
}

function measureStage() {
	if (!rootEl.value) return
	const height = scrollerEl ? scrollerEl.clientHeight : window.innerHeight
	rootEl.value.style.setProperty('--stage-h', `${Math.max(480, Math.round(height))}px`)
	if (pinEl.value) {
		isPinned.value = getComputedStyle(pinEl.value).position === 'sticky'
	}
	requestStageUpdate()
}

function goToScene(index) {
	const target = clamp(index, 0, sceneCount - 1)
	if (!isPinned.value) {
		layerEls.value[target]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
		return
	}
	const geometry = stageGeometry()
	if (!geometry) return
	const desired = ((target + 0.5) / sceneCount) * geometry.total
	const delta = desired - geometry.scrolled
	const options = { top: delta, behavior: 'smooth' }
	if (scrollerEl) scrollerEl.scrollBy(options)
	else window.scrollBy(options)
}

function prevScene() {
	goToScene(activeSceneIndex.value - 1)
}

function nextScene() {
	goToScene(activeSceneIndex.value + 1)
}

async function copyText(text, label = '') {
	try {
		await navigator.clipboard.writeText(text)
		copyStatus.value = label || text
		if (copyTimer) clearTimeout(copyTimer)
		copyTimer = setTimeout(() => {
			copyStatus.value = ''
		}, 2000)
	} catch (error) {
		console.error('Failed to copy to clipboard:', error)
	}
}

function planRouteTo(landmark) {
	router.push({
		path: '/transport',
		query: { end: landmark.name },
	})
}

function formatCounted(value, decimals) {
	return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value))
}

function runMetricCounters() {
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
	if (reduce) {
		displayMetrics.value = serverMetrics.map((metric) => metric.value)
		return
	}

	const duration = 1500
	const start = performance.now()
	const parsed = serverMetrics.map((metric) => {
		return metric.value.split(/(\d+(?:\.\d+)?)/).map((part, partIndex) => {
			if (partIndex % 2 === 0) return { text: part }
			const target = Number(part)
			const decimals = part.includes('.') ? part.split('.')[1].length : 0
			// Year-like numbers count up from a short distance so they read as a timeline, not a lottery.
			const from = target >= 1900 ? target - 28 : 0
			return { target, from, decimals }
		})
	})

	const tick = (now) => {
		const raw = clamp((now - start) / duration, 0, 1)
		const eased = 1 - Math.pow(1 - raw, 4)
		displayMetrics.value = parsed.map((tokens) => {
			return tokens
				.map((token) => {
					if ('text' in token) return token.text
					return formatCounted(token.from + (token.target - token.from) * eased, token.decimals)
				})
				.join('')
		})
		if (raw < 1) metricsFrame = requestAnimationFrame(tick)
	}
	metricsFrame = requestAnimationFrame(tick)
}

onMounted(async () => {
	await nextTick()
	scrollerEl = rootEl.value?.closest('.app-main') || null
	const scrollTarget = scrollerEl || window
	scrollTarget.addEventListener('scroll', requestStageUpdate, { passive: true })
	window.addEventListener('resize', measureStage)

	if ('ResizeObserver' in window) {
		resizeObserver = new ResizeObserver(measureStage)
		resizeObserver.observe(scrollerEl || document.documentElement)
	}
	measureStage()

	if (metricsEl.value && 'IntersectionObserver' in window) {
		displayMetrics.value = serverMetrics.map((metric) => metric.value.replace(/\d/g, '0'))
		metricsObserver = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return
				metricsObserver?.disconnect()
				runMetricCounters()
			},
			{ root: scrollerEl, threshold: 0.35 },
		)
		metricsObserver.observe(metricsEl.value)
	}
})

watch(activeSceneIndex, () => {
	wipeKey.value++
})

onBeforeUnmount(() => {
	const scrollTarget = scrollerEl || window
	scrollTarget.removeEventListener('scroll', requestStageUpdate)
	window.removeEventListener('resize', measureStage)
	resizeObserver?.disconnect()
	metricsObserver?.disconnect()
	if (scrollFrame) cancelAnimationFrame(scrollFrame)
	if (metricsFrame) cancelAnimationFrame(metricsFrame)
	if (copyTimer) clearTimeout(copyTimer)
})
</script>

<template>
	<div ref="rootEl" class="server-intro-page page-shell">
		<div class="page-progress" aria-hidden="true"></div>

		<header class="hero">
			<div class="hero-skyline" aria-hidden="true">
				<span
					v-for="column in skyline"
					:key="column.id"
					class="skyline-column"
					:style="{ '--col-h': `${column.height}%`, '--col-d': `${column.delay}ms` }"
				></span>
			</div>
			<p class="hero-year mono" aria-hidden="true">2022</p>

			<div class="wrap hero-body">
				<h1 class="hero-title">
					<span v-for="(word, idx) in heroWords" :key="`${word}-${idx}`" class="hero-word">
						<span :style="{ '--i': idx }">{{ word }}</span>
					</span>
				</h1>
				<p class="hero-description">{{ t('serverPage.heroDescription') }}</p>

				<div class="quick-connect-strip" :aria-label="t('serverPage.quickSpecsLabel')">
					<div class="spec-cell">
						<span class="spec-label">{{ t('serverPage.gameVersion') }}</span>
						<strong class="spec-value mono">{{ serverSpecs.version }}</strong>
					</div>

					<div class="spec-cell ip-cell">
						<span class="spec-label">{{ t('serverPage.serverAddress') }}</span>
						<div class="ip-row">
							<strong class="spec-value mono">{{ serverSpecs.domain }}</strong>
							<button
								type="button"
								class="copy-btn"
								:class="{ 'is-copied': copyStatus === serverSpecs.domain }"
								:aria-label="t('serverPage.copyIp')"
								@click="copyText(serverSpecs.domain, serverSpecs.domain)"
							>
								{{ copyStatus === serverSpecs.domain ? t('serverPage.copied') : t('serverPage.copyIp') }}
							</button>
						</div>
					</div>

					<div class="spec-cell">
						<span class="spec-label">{{ t('serverPage.protocolType') }}</span>
						<strong class="spec-value">{{ serverSpecs.protocolNote }}</strong>
					</div>

					<div class="spec-cell">
						<span class="spec-label">{{ t('serverPage.authAccess') }}</span>
						<strong class="spec-value auth-badge">{{ t('serverPage.specs.authDesc') }}</strong>
					</div>

					<div class="spec-action">
						<router-link to="/dashboard" class="action-btn-primary">
							{{ t('serverPage.viewStatus') }}
						</router-link>
					</div>
				</div>
			</div>

			<div class="scroll-cue" aria-hidden="true">
				<span class="scroll-cue-label mono">{{ t('serverPage.scrollHint') }}</span>
				<span class="scroll-cue-line"></span>
			</div>
		</header>

		<section class="ticker" :class="{ 'is-paused': tickerPaused }">
			<div class="ticker-viewport" aria-hidden="true">
				<div class="ticker-track">
					<div v-for="group in 2" :key="group" class="ticker-group">
						<span v-for="(item, idx) in tickerItems" :key="`${group}-${idx}`" class="ticker-item">
							<span class="ticker-text" :class="{ 'is-outline': idx % 2 === 1 }">{{ item }}</span>
							<span class="ticker-sep"></span>
						</span>
					</div>
				</div>
			</div>
			<button
				type="button"
				class="ticker-toggle"
				:aria-label="tickerPaused ? t('serverPage.tickerPlay') : t('serverPage.tickerPause')"
				@click="tickerPaused = !tickerPaused"
			>
				<svg v-if="!tickerPaused" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
					<path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor" />
				</svg>
				<svg v-else viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
					<path d="M4 3l9 5-9 5z" fill="currentColor" />
				</svg>
			</button>
		</section>

		<section ref="metricsEl" class="metrics-section">
			<div class="wrap">
				<div class="metrics-strip" :aria-label="t('serverPage.quickSpecsLabel')">
					<article
						v-for="(metric, idx) in serverMetrics"
						:key="metric.id"
						class="metric-cell"
						:style="{ '--metric-index': idx }"
					>
						<span class="metric-top-bar" aria-hidden="true"></span>
						<span class="metric-label">{{ t(metric.labelKey) }}</span>
						<strong class="metric-value mono">{{ displayMetrics[idx] }}</strong>
						<span class="metric-sub">{{ t(metric.subKey) }}</span>
					</article>
				</div>
			</div>
		</section>

		<section class="wrap chapter-intro">
			<h2 class="display-title">{{ t('serverPage.sceneTitle') }}</h2>
			<p class="chapter-intro-lead">{{ t('serverPage.sceneSubtitle') }}</p>
		</section>

		<!-- Pinned theatrical stage: scrolling drives the chapter, not the other way around. -->
		<section
			ref="stageEl"
			class="theater"
			:class="{ 'is-pinned': isPinned }"
			:style="{ '--scene-count': sceneCount, '--scene-span-ratio': 0.75 }"
		>
			<div ref="pinEl" class="theater-pin">
				<div class="theater-bg" aria-hidden="true">
					<span
						v-for="(scene, idx) in serverScenes"
						:key="scene.id"
						class="bg-numeral mono"
						:class="layerState(idx)"
					>
						{{ scene.index }}
					</span>
				</div>

				<div v-if="wipeKey" :key="wipeKey" class="stage-wipe" aria-hidden="true"></div>

				<div class="theater-layers">
					<article
						v-for="(scene, idx) in serverScenes"
						:key="scene.id"
						:ref="(element) => setLayerRef(element, idx)"
						class="scene-layer"
						:class="layerState(idx)"
						:aria-hidden="isPinned && idx !== activeSceneIndex ? 'true' : undefined"
						:inert="isPinned && idx !== activeSceneIndex"
					>
						<div class="layer-grid">
							<div class="layer-narrative">
								<div class="layer-meta reveal-item" style="--k: 0">
									<span class="layer-era mono">{{ locale === 'zh' ? scene.period : scene.periodEn }}</span>
									<span class="layer-count mono">{{ scene.index }} / {{ String(sceneCount).padStart(2, '0') }}</span>
								</div>

								<h3 class="layer-headline"><span>{{ t(scene.titleKey) }}</span></h3>
								<p class="layer-lead reveal-item" style="--k: 2">{{ t(scene.leadKey) }}</p>
								<p class="layer-desc reveal-item" style="--k: 3">{{ t(scene.descKey) }}</p>

								<div class="stage-badges reveal-item" style="--k: 4">
									<span v-for="badge in scene.badges" :key="badge.key" class="stage-badge">
										<strong>{{ t(badge.key) }}</strong>
										<small class="mono">{{ badge.value }}</small>
									</span>
								</div>
							</div>

							<div class="layer-visual reveal-item" style="--k: 3">
								<div class="scene-photo-frame">
									<picture class="scene-photo-picture">
										<source :srcset="scene.imageWebp" type="image/webp" />
										<img
											:src="scene.image"
											:alt="t(scene.imageCaptionKey)"
											class="scene-photo-img"
											loading="lazy"
											decoding="async"
										/>
									</picture>
									<div class="photo-caption-bar mono">
										<span class="caption-index">{{ scene.index }}</span>
										<span class="caption-text">{{ t(scene.imageCaptionKey) }}</span>
									</div>
								</div>

								<div class="scene-specs-matrix mono">
									<div
										v-for="spec in scene.specs"
										:key="spec.labelKey"
										class="matrix-cell"
									>
										<span class="matrix-label">{{ t(spec.labelKey) }}</span>
										<strong class="matrix-value">{{ spec.value }}</strong>
									</div>
								</div>
							</div>
						</div>
					</article>
				</div>

				<div class="theater-rail">
					<button
						type="button"
						class="scene-nav-arrow"
						:aria-label="t('serverPage.prevScene')"
						:disabled="activeSceneIndex === 0"
						@click="prevScene"
					>
						<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
							<path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.6" />
						</svg>
					</button>

					<div class="rail-segments" role="tablist">
						<button
							v-for="(scene, idx) in serverScenes"
							:key="scene.id"
							type="button"
							class="rail-seg"
							:class="{ 'is-active': activeSceneIndex === idx, 'is-done': idx < activeSceneIndex }"
							:style="{ '--i': idx }"
							role="tab"
							:aria-selected="activeSceneIndex === idx"
							@click="goToScene(idx)"
						>
							<span class="rail-fill" aria-hidden="true"></span>
							<span class="rail-label">
								<span class="rail-num mono">{{ scene.index }}</span>
								<span class="rail-name">{{ t(scene.tagKey) }}</span>
							</span>
						</button>
					</div>

					<button
						type="button"
						class="scene-nav-arrow"
						:aria-label="t('serverPage.nextScene')"
						:disabled="activeSceneIndex === sceneCount - 1"
						@click="nextScene"
					>
						<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
							<path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" />
						</svg>
					</button>
				</div>
			</div>
		</section>

		<div class="wrap server-body">
			<!-- QPlugin Architecture Details -->
			<section class="server-section">
				<div class="section-heading">
					<h2>{{ t('serverPage.qpluginTitle') }}</h2>
					<p>{{ t('serverPage.qpluginDescription') }}</p>
				</div>

				<div class="qplugin-console-panel">
					<div class="qplugin-tabs" role="tablist">
						<button
							v-for="tab in qpluginTabs"
							:key="tab.id"
							type="button"
							class="qplugin-tab-btn"
							:class="{ 'is-active': activeQPluginTabId === tab.id }"
							role="tab"
							:aria-selected="activeQPluginTabId === tab.id"
							@click="activeQPluginTabId = tab.id"
						>
							{{ t(tab.labelKey) }}
						</button>
					</div>

					<div class="qplugin-tab-content">
						<div class="qplugin-cards">
							<article
								v-for="item in activeQPluginTab.items"
								:key="item.id"
								class="qplugin-item-card"
							>
								<div class="qplugin-header">
									<h3>{{ t(item.titleKey) }}</h3>
									<span class="qplugin-badge mono">{{ t(item.badgeKey) }}</span>
								</div>
								<p class="qplugin-desc">{{ t(item.descKey) }}</p>
								<div class="qplugin-terminal-line mono">
									<span class="terminal-prompt">$</span>
									<code>{{ item.code }}</code>
								</div>
							</article>
						</div>
					</div>
				</div>
			</section>

			<!-- Sub-Servers Modes -->
			<section class="server-section">
				<div class="section-heading">
					<h2>{{ t('serverPage.modesTitle') }}</h2>
					<p>{{ t('serverPage.modesDescription') }}</p>
				</div>

				<div class="modes-grid">
					<article
						v-for="(mode, idx) in serverModes"
						:key="mode.id"
						class="mode-card"
						:style="{ '--mode-index': idx }"
					>
						<div class="mode-header">
							<div class="mode-identity">
								<h3>{{ t(mode.nameKey) }}</h3>
								<span class="mode-tag">{{ t(mode.tagKey) }}</span>
							</div>
							<button
								type="button"
								class="mode-command mono"
								:title="t('serverPage.copyIp')"
								@click="copyText(mode.command, mode.command)"
							>
								<code>{{ mode.command }}</code>
								<span class="command-copy-tag">
									{{ copyStatus === mode.command ? t('serverPage.copied') : t('commandPage.copy') }}
								</span>
							</button>
						</div>

						<p class="mode-desc">{{ t(mode.descKey) }}</p>

						<ul class="mode-features">
							<li v-for="featureKey in mode.features" :key="featureKey">
								<span class="feature-square" aria-hidden="true"></span>
								<span>{{ t(featureKey) }}</span>
							</li>
						</ul>
					</article>
				</div>
			</section>

			<!-- Proprietary Ecosystem Highlights -->
			<section class="server-section">
				<div class="section-heading">
					<h2>{{ t('serverPage.featuresTitle') }}</h2>
					<p>{{ t('serverPage.featuresDescription') }}</p>
				</div>

				<div class="features-grid">
					<article
						v-for="(item, idx) in serverHighlights"
						:key="item.id"
						class="feature-card"
						:style="{ '--feat-index': idx }"
					>
						<div class="feature-header">
							<h3>{{ t(item.nameKey) }}</h3>
							<code v-if="item.command" class="feature-command mono">{{ item.command }}</code>
						</div>
						<p class="feature-desc">{{ t(item.descKey) }}</p>
						<div v-if="item.link" class="feature-link-wrap">
							<router-link :to="item.link" class="feature-link">
								{{ t('serverPage.exploreTitle') }}
								<span class="link-arrow" aria-hidden="true">-></span>
							</router-link>
						</div>
					</article>
				</div>
			</section>

			<!-- Landmarks -->
			<section class="server-section">
				<div class="section-heading">
					<h2>{{ t('serverPage.landmarksTitle') }}</h2>
					<p>{{ t('serverPage.landmarksDescription') }}</p>
				</div>

				<div class="landmarks-grid">
					<article
						v-for="(landmark, idx) in serverLandmarks"
						:key="landmark.id"
						class="landmark-card"
						:style="{ '--landmark-index': idx }"
					>
						<div class="landmark-header">
							<div class="landmark-titles">
								<h3>{{ locale === 'zh' ? landmark.name : landmark.nameEn }}</h3>
								<span v-if="locale === 'zh'" class="landmark-sub">{{ landmark.nameEn }}</span>
							</div>
							<span class="landmark-badge">{{ t(landmark.categoryKey) }}</span>
						</div>

						<div class="landmark-meta">
							<div class="meta-row">
								<span class="meta-label">{{ t('serverPage.builderLabel') }}</span>
								<strong class="meta-value">{{ landmark.builder }}</strong>
							</div>
							<div class="meta-row">
								<span class="meta-label">{{ t('serverPage.coordsLabel') }}</span>
								<button
									type="button"
									class="coords-btn mono"
									:title="t('serverPage.copyIp')"
									@click="copyText(landmark.coordinates, landmark.coordinates)"
								>
									<span>{{ landmark.coordinates }}</span>
									<span class="coords-tag">
										{{ copyStatus === landmark.coordinates ? t('serverPage.coordsCopied') : t('commandPage.copy') }}
									</span>
								</button>
							</div>
							<div class="meta-row">
								<span class="meta-label">{{ t('serverPage.transitLabel') }}</span>
								<span class="meta-value">{{ locale === 'zh' ? landmark.transit : landmark.transitEn }}</span>
							</div>
						</div>

						<button
							type="button"
							class="landmark-action-btn"
							@click="planRouteTo(landmark)"
						>
							<span>{{ t('serverPage.planRoute') }}</span>
							<span class="action-arrow" aria-hidden="true">-></span>
						</button>
					</article>
				</div>
			</section>

			<!-- Onboarding Quick Steps -->
			<section class="server-section">
				<div class="section-heading">
					<h2>{{ t('serverPage.stepsTitle') }}</h2>
					<p>{{ t('serverPage.stepsDescription') }}</p>
				</div>

				<div class="steps-grid">
					<article
						v-for="(item, idx) in quickSteps"
						:key="item.step"
						class="step-card"
						:style="{ '--step-index': idx }"
					>
						<span class="step-num mono" aria-hidden="true">{{ item.step }}</span>
						<div class="step-content">
							<h3>{{ t(item.titleKey) }}</h3>
							<p>{{ t(item.descKey) }}</p>
						</div>
						<router-link
							v-if="item.link && item.actionKey"
							:to="item.link"
							class="step-action"
						>
							{{ t(item.actionKey) }}
						</router-link>
					</article>
				</div>
			</section>

			<!-- Quick Links -->
			<section class="server-section quick-links-section">
				<div class="section-heading">
					<h2>{{ t('serverPage.quickLinksTitle') }}</h2>
				</div>

				<div class="quick-links-grid">
					<router-link to="/dashboard" class="quick-link-card">
						<strong>{{ t('mainPage.dashboard') }}</strong>
						<span>{{ t('mainPage_description.dashboard') }}</span>
					</router-link>
					<router-link to="/rankings" class="quick-link-card">
						<strong>{{ t('mainPage.rankings') }}</strong>
						<span>{{ t('mainPage_description.rankings') }}</span>
					</router-link>
					<router-link to="/transport" class="quick-link-card">
						<strong>{{ t('mainPage.transport') }}</strong>
						<span>{{ t('mainPage_description.transport') }}</span>
					</router-link>
					<router-link to="/guides" class="quick-link-card">
						<strong>{{ t('nav.wiki_guides') }}</strong>
						<span>{{ t('nav.wiki_guides_description') }}</span>
					</router-link>
				</div>
			</section>
		</div>

		<section class="finale">
			<div class="wrap finale-inner">
				<h2 class="finale-title">{{ t('serverPage.ctaTitle') }}</h2>
				<button
					type="button"
					class="finale-address mono"
					:aria-label="t('serverPage.ctaAddress')"
					@click="copyText(serverSpecs.domain, serverSpecs.domain)"
				>
					<span
						v-for="(char, idx) in domainChars"
						:key="idx"
						class="address-char"
						:style="{ '--ci': idx }"
						aria-hidden="true"
					>{{ char }}</span>
					<span class="sr-only">{{ serverSpecs.domain }}</span>
				</button>
				<div class="finale-actions">
					<span class="finale-hint mono">
						{{ copyStatus === serverSpecs.domain ? t('serverPage.copied') : t('serverPage.copyIp') }}
					</span>
					<router-link to="/register" class="finale-link">{{ t('serverPage.step1Action') }}</router-link>
					<router-link to="/dashboard" class="finale-link is-ghost">{{ t('serverPage.viewStatus') }}</router-link>
				</div>
			</div>
		</section>
	</div>
</template>

<style scoped src="./ServerView.css"></style>
