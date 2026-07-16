<script setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {loadNewsFeed} from '@/utils/newsFeed'
import {homeCampaign, regularHome} from '@/data/home'

const {locale, t} = useI18n()
const shaderCanvas = ref(null)
const homeRoot = ref(null)
const newsItems = ref([])
let animationFrame = 0
let cleanupShader = () => {}
let shaderTheme = 0
let newsRefreshTimer = 0
let revealObserver = null
const shaderFrameInterval = 1000 / 36
const shaderTimeScale = 2.2
const activeHome = computed(() => (homeCampaign.enabled ? homeCampaign : regularHome))
const heroTitle = computed(() => t(activeHome.value.titleKey))
const heroBrand = computed(() => t(activeHome.value.brandKey))

const localizedNews = computed(() =>
	newsItems.value.slice(0, 20).map((item, index) => ({
		...item,
		isFeatured: homeCampaign.enabled
			? item.id === homeCampaign.featuredNewsId || (!homeCampaign.featuredNewsId && index === 0)
			: index === 0,
		type: item.type[locale.value] || item.type.zh,
		title: item.title[locale.value] || item.title.zh,
		description: item.description[locale.value] || item.description.zh,
	}))
)
const featuredNews = computed(() => localizedNews.value.find((item) => item.isFeatured) || localizedNews.value[0] || null)
const regularNews = computed(() => localizedNews.value.filter((item) => item.id !== featuredNews.value?.id))
const currentYear = new Date().getFullYear()

async function syncNewsFeed() {
	newsItems.value = await loadNewsFeed()
}

async function observeRevealItems() {
	await nextTick()
	const elements = homeRoot.value?.querySelectorAll('.reveal-item:not(.is-observed)') || []
	elements.forEach((element) => {
		element.classList.add('is-observed')
		if (revealObserver) {
			revealObserver.observe(element)
		} else {
			element.classList.add('is-visible')
		}
	})
}


function createShader(gl, type, source) {
	const shader = gl.createShader(type)
	gl.shaderSource(shader, source)
	gl.compileShader(shader)

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(shader))
		gl.deleteShader(shader)
		return null
	}

	return shader
}

function createProgram(gl, vertexSource, fragmentSource) {
	const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource)
	const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)

	if (!vertexShader || !fragmentShader) {
		return null
	}

	const program = gl.createProgram()
	gl.attachShader(program, vertexShader)
	gl.attachShader(program, fragmentShader)
	gl.linkProgram(program)
	gl.deleteShader(vertexShader)
	gl.deleteShader(fragmentShader)

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error(gl.getProgramInfoLog(program))
		gl.deleteProgram(program)
		return null
	}

	return program
}

function initShaderBackground() {
	const canvas = shaderCanvas.value
	const reduceMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')

	if (!canvas || reduceMotionQuery?.matches) {
		return
	}

	const gl = canvas.getContext('webgl', {
		antialias: false,
		alpha: true,
		depth: false,
		stencil: false,
		preserveDrawingBuffer: false,
		powerPreference: 'low-power',
	})

	if (!gl) {
		return
	}

	const vertexSource = `
		attribute vec2 a_position;
		varying vec2 v_uv;

		void main() {
			v_uv = a_position * 0.5 + 0.5;
			gl_Position = vec4(a_position, 0.0, 1.0);
		}
	`

	const fragmentSource = `
		precision mediump float;

		uniform vec2 u_resolution;
		uniform float u_time;
		uniform float u_theme;
		varying vec2 v_uv;

		float hash(vec2 p) {
			return fract(sin(dot(p, vec2(120.1, 311.7))) * 758.5453123);
		}

		float noise(vec2 p) {
			vec2 i = floor(p);
			vec2 f = fract(p);
			vec2 u = f * f * (3.0 - 2.0 * f);

			float a = hash(i);
			float b = hash(i + vec2(1.0, 0.0));
			float c = hash(i + vec2(0.0, 1.0));
			float d = hash(i + vec2(1.0, 1.0));

			return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
		}

		float fbm(vec2 p) {
			float value = 0.0;
			float amplitude = 0.5;
			mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);

			for (int i = 0; i < 3; i++) {
				value += amplitude * noise(p);
				p = rot * p * 2.04 + vec2(11.7, 4.3);
				amplitude *= 0.5;
			}

			return value;
		}

		vec2 flowField(vec2 p, float t) {
			float n1 = fbm(p * 1.15 + vec2(t * 0.08, -t * 0.05));
			float n2 = fbm(p * 1.10 + vec2(-t * 0.06, t * 0.09) + 7.3);
			float angle = (n1 - n2) * 6.28318 + t * 0.16;
			return vec2(cos(angle), sin(angle));
		}

		void main() {
			vec2 uv = gl_FragCoord.xy / u_resolution.xy;
			vec2 p = uv - 0.5;
			p.x *= u_resolution.x / u_resolution.y;
			float t = u_time;

			vec2 q = p;
			for (int i = 0; i < 2; i++) {
				vec2 flow = flowField(q * 0.9, t);
				q += flow * 0.05;
				q += vec2(sin(t * 0.11 + q.y * 2.0), cos(t * 0.10 + q.x * 2.0)) * 0.025;
			}

			vec2 drift = vec2(t * 0.035, -t * 0.022);
			float smoke = fbm(q * 2.0 + drift);
			smoke += 0.55 * fbm(q * 4.0 - drift.yx + 2.7);
			smoke = smoke / 0.75;

			float haze = fbm(q * 0.78 + vec2(-t * 0.018, t * 0.014));
			float plume = smoothstep(0.24, 0.92, smoke);
			float softBody = smoothstep(0.16, 0.86, haze * 0.55 + smoke * 0.45);
			float filament = 1.0 - smoothstep(0.02, 0.12, abs(smoke - 0.56));
			float density = softBody * 0.74 + plume * 0.24 + filament * 0.08;

			float edgeFalloff = 0.86 + 0.14 * smoothstep(1.4, 0.1, length(p));
			vec3 ink = vec3(0.01, 0.018, 0.035);
			vec3 blue = vec3(0.025, 0.08, 0.20);
			vec3 cyan = vec3(0.06, 0.14, 0.22);
			vec3 color = mix(ink, blue, smoke);
			color = mix(color, cyan, filament * 0.08);
			float alpha = density * edgeFalloff * mix(0.64, 0.24, u_theme);

			gl_FragColor = vec4(color, alpha);
		}
	`

	const program = createProgram(gl, vertexSource, fragmentSource)
	if (!program) {
		return
	}

	const positionBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
		gl.STATIC_DRAW
	)

	const positionLocation = gl.getAttribLocation(program, 'a_position')
	const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
	const timeLocation = gl.getUniformLocation(program, 'u_time')
	const themeLocation = gl.getUniformLocation(program, 'u_theme')
	const start = window.__qoSharedShaderStart ?? performance.now()
	window.__qoSharedShaderStart = start
	let isCanvasVisible = true
	let shouldRender = true
	let isLoopRunning = false
	let needsResize = true
	let lastFrameTime = 0

	const syncTheme = () => {
		shaderTheme = document.documentElement.dataset.theme === 'dark' ? 1 : 0
	}

	const resize = () => {
		const dpr = Math.min(window.devicePixelRatio || 1, 1.25)
		const width = Math.max(1, Math.floor(canvas.clientWidth * dpr))
		const height = Math.max(1, Math.floor(canvas.clientHeight * dpr))

		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width
			canvas.height = height
			gl.viewport(0, 0, width, height)
		}
	}

	const requestResize = () => {
		needsResize = true
	}

	const renderFrame = () => {
		if (needsResize) {
			resize()
			needsResize = false
		}

		gl.clearColor(0, 0, 0, 0)
		gl.clear(gl.COLOR_BUFFER_BIT)
		gl.useProgram(program)
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
		gl.enableVertexAttribArray(positionLocation)
		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
		gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
		gl.uniform1f(timeLocation, ((performance.now() - start) / 1000) * shaderTimeScale)
		gl.uniform1f(themeLocation, shaderTheme)
		gl.drawArrays(gl.TRIANGLES, 0, 6)
	}

	const render = (now) => {
		if (!shouldRender) {
			isLoopRunning = false
			return
		}

		if (now - lastFrameTime >= shaderFrameInterval) {
			lastFrameTime = now
			renderFrame()
		}

		animationFrame = requestAnimationFrame(render)
	}

	const startRenderLoop = () => {
		if (!isLoopRunning) {
			isLoopRunning = true
			animationFrame = requestAnimationFrame(render)
		}
	}

	const updateRenderState = () => {
		shouldRender = document.visibilityState === 'visible' && isCanvasVisible

		if (shouldRender) {
			startRenderLoop()
		} else {
			cancelAnimationFrame(animationFrame)
			isLoopRunning = false
		}
	}

	const syncVisibility = () => {
		updateRenderState()
	}

	const visibilityObserver = new IntersectionObserver(([entry]) => {
		isCanvasVisible = entry.isIntersecting
		updateRenderState()
	}, {
		threshold: 0,
	})

	window.addEventListener('resize', requestResize, {passive: true})
	document.addEventListener('visibilitychange', syncVisibility)
	visibilityObserver.observe(canvas)
	syncTheme()
	const themeObserver = new MutationObserver(syncTheme)
	themeObserver.observe(document.documentElement, {
		attributeFilter: ['data-theme'],
	})
	renderFrame()
	startRenderLoop()

	cleanupShader = () => {
		cancelAnimationFrame(animationFrame)
		window.removeEventListener('resize', requestResize)
		document.removeEventListener('visibilitychange', syncVisibility)
		visibilityObserver.disconnect()
		themeObserver.disconnect()
		gl.deleteBuffer(positionBuffer)
		gl.deleteProgram(program)
	}
}

onMounted(async () => {
	initShaderBackground()
	if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
		revealObserver = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return
				entry.target.classList.add('is-visible')
				revealObserver?.unobserve(entry.target)
			})
		}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
	}
	await syncNewsFeed()
	await observeRevealItems()
	newsRefreshTimer = window.setInterval(syncNewsFeed, 15000)
})

watch(newsItems, observeRevealItems)

onBeforeUnmount(() => {
	window.clearInterval(newsRefreshTimer)
	revealObserver?.disconnect()
	cleanupShader()
})
</script>

<template>
	<div ref="homeRoot" class="home page-shell" :class="{ 'home--campaign': homeCampaign.enabled }">
		<canvas ref="shaderCanvas" class="shader-background" aria-hidden="true"></canvas>
		<div class="home-content">
			<section class="home-hero" aria-labelledby="home-title">
				<div class="hero-copy">
					<span class="hero-brand">{{ heroBrand }}</span>
					<h1 id="home-title">{{ heroTitle }}</h1>
				</div>
				<a class="scroll-cue" href="#home-news" :aria-label="t('homePage.scroll_to_feed')">
					<span>{{ t('homePage.scroll_to_feed') }}</span>
					<span class="scroll-cue-line" aria-hidden="true"></span>
				</a>
			</section>

			<section id="home-news" class="news-feed" aria-labelledby="news-title">
				<article
					v-if="featuredNews"
					class="news-item news-item--featured reveal-item"
					:class="{
						'news-item--text-only': !featuredNews.image,
						'news-item--collapse': featuredNews.id === '2026collapse',
					}"
				>
					<div v-if="featuredNews.image" class="news-image">
						<img :src="featuredNews.image" :alt="featuredNews.title" loading="lazy">
					</div>
					<div class="news-body">
						<div v-if="featuredNews.id === '2026collapse'" class="collapse-signal">
							{{ locale === 'zh' ? 'DOC. STEINBECK // 实验进行中' : 'DR. STEINBECK // EXPERIMENT IN PROGRESS' }}
						</div>
						<div class="news-meta">
							<span>{{ featuredNews.type }}</span>
							<time :datetime="featuredNews.date">{{ featuredNews.date }}</time>
						</div>
						<h3>{{ featuredNews.title }}</h3>
						<p v-if="featuredNews.id === '2026collapse'" class="news-deck">{{ featuredNews.description }}</p>
						<router-link :to="featuredNews.to" class="news-link">
							<span>{{ t('homePage.read_more') }}</span>
							<span class="news-link-arrow" aria-hidden="true"></span>
						</router-link>
					</div>
				</article>

				<div class="news-list" v-if="regularNews.length">
					<article
						v-for="(item, index) in regularNews"
						:key="item.id"
						class="news-item reveal-item"
						:class="{
							'news-item--text-only': !item.image,
							'news-item--collapse': item.id === '2026collapse',
						}"
						:style="{ '--reveal-order': Math.min(index, 5) }"
					>
						<div v-if="item.image" class="news-image">
							<img :src="item.image" :alt="item.title" loading="lazy">
						</div>
						<div class="news-body">
							<div class="news-meta">
								<span>{{ item.type }}</span>
								<time :datetime="item.date">{{ item.date }}</time>
							</div>
							<h3>{{ item.title }}</h3>
							<router-link :to="item.to" class="news-link">
								<span>{{ t('homePage.read_more') }}</span>
								<span class="news-link-arrow" aria-hidden="true"></span>
							</router-link>
						</div>
					</article>
				</div>
			</section>

			<footer class="home-footer reveal-item">
				<div class="footer-brand">
					<strong>Quantum Original</strong>
					<p>Copyright {{ currentYear }} Quantum Original & Holographic Lab. All rights reserved.</p>
				</div>
			</footer>
		</div>
	</div>
</template>

<style scoped>
.home-content {
	position: relative;
	z-index: 1;
	width: min(1560px, 100%);
	min-height: 100%;
	margin: 0 auto;
	padding: 0 clamp(1rem, 4vw, 3rem) clamp(3rem, 8vh, 6rem);
	box-sizing: border-box;
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	align-content: start;
	gap: clamp(4rem, 10vh, 8rem);
}

.home-footer {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: clamp(1.5rem, 4vw, 3rem);
	border-top: 1px solid color-mix(in srgb, var(--text-main) 12%, transparent);
	padding: clamp(1.5rem, 4vw, 2.4rem) 0 clamp(3rem, 8vh, 6rem);
	color: var(--text-secondary);
}

.footer-brand {
	display: grid;
	gap: 0.45rem;
}

.footer-brand strong {
	color: var(--title-color);
	font-size: clamp(1.15rem, 2vw, 1.45rem);
	font-weight: 680;
	line-height: 1.15;
}

.footer-brand p {
	margin: 0;
	font-size: 0.9rem;
	line-height: 1.5;
}

.footer-links {
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 0.65rem 1rem;
}

.footer-links a {
	color: var(--text-secondary);
	font-size: 0.92rem;
	font-weight: 680;
	text-decoration: none;
}

.footer-links a:hover {
	color: var(--primary);
}

.home-hero {
	position: relative;
	display: grid;
	align-content: center;
	align-items: end;
	gap: 1.5rem;
	min-height: calc(100dvh - var(--app-header-height, 0px));
	padding: clamp(4rem, 8vh, 5.5rem) 0 clamp(2rem, 5vh, 3.5rem);
	box-sizing: border-box;
}

.hero-copy {
	display: grid;
	gap: 1rem;
	width: 100%;
	min-width: 0;
}

.hero-brand {
	width: fit-content;
	color: var(--primary-light);
	font-size: clamp(1.15rem, 2.2vw, 1.9rem);
	font-weight: 700;
	line-height: 1;
	animation: hero-brand-in 520ms cubic-bezier(0.22, 1, 0.36, 1) 80ms both;
}

.home-hero h1 {
	margin: 0;
	color: var(--title-color);
	font-size: clamp(2.2rem, 5.8vw, 5rem);
	font-weight: 520;
	line-height: 0.98;
	max-width: min(100%, 20ch);
	overflow-wrap: normal;
	word-break: normal;
	text-wrap: balance;
	animation: hero-title-in 720ms cubic-bezier(0.16, 1, 0.3, 1) 150ms both;
}

.home--campaign .hero-brand {
	color: #93c5fd;
}

.home--campaign .home-hero h1 {
	max-width: min(100%, 24ch);
}

.scroll-cue {
	position: absolute;
	left: 50%;
	bottom: clamp(1.5rem, 4vh, 3rem);
	transform: translateX(-50%);
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	gap: 0.55rem;
	color: var(--text-secondary);
	font-size: 0.92rem;
	font-weight: 760;
	text-decoration: none;
	animation: scroll-cue-in 520ms ease 620ms both;
}

.scroll-cue:hover {
	color: var(--primary);
}

.scroll-cue-line {
	position: relative;
	width: 18px;
	height: 18px;
	background: transparent;
	opacity: 0.8;
	border-right: 2px solid currentColor;
	border-bottom: 2px solid currentColor;
	transform: rotate(45deg);
	animation: scroll-cue-pulse 1.8s ease-in-out 1s infinite;
}

.scroll-cue-line::after {
	content: none;
}

.news-feed {
	width: 100%;
	padding: 0;
	box-sizing: border-box;
	display: grid;
	gap: clamp(0.9rem, 2vw, 1.35rem);
}

.section-heading {
	padding-bottom: clamp(1.5rem, 4vw, 2.4rem);
	border-bottom: 1px solid color-mix(in srgb, var(--text-main) 12%, transparent);
}

.section-heading h2 {
	margin: 0;
	color: var(--title-color);
	font-size: clamp(1.45rem, 3vw, 2.45rem);
	font-weight: 720;
	line-height: 1.2;
}

.news-list {
	column-width: 18rem;
	column-gap: clamp(0.9rem, 2vw, 1.35rem);
}

.news-item {
	position: relative;
	display: grid;
	grid-template-columns: 1fr;
	width: 100%;
	margin: 0;
	min-height: 0;
	background: color-mix(in srgb, var(--background) 42%, transparent);
	border: 1px solid color-mix(in srgb, var(--text-main) 12%, transparent);
	backdrop-filter: blur(16px) saturate(115%);
	overflow: hidden;
	break-inside: avoid;
	page-break-inside: avoid;
	transition: transform 220ms ease, border-color 220ms ease, background-color 220ms ease;
}

.reveal-item {
	opacity: 0;
	transform: translateY(24px);
	transition:
		opacity 560ms ease calc(var(--reveal-order, 0) * 55ms),
		transform 560ms cubic-bezier(0.22, 1, 0.36, 1) calc(var(--reveal-order, 0) * 55ms),
		border-color 220ms ease,
		background-color 220ms ease;
}

.reveal-item.is-visible {
	opacity: 1;
	transform: translateY(0);
}

.news-list .news-item {
	display: inline-grid;
	margin-bottom: clamp(0.9rem, 2vw, 1.35rem);
}

.news-item--featured {
	grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
	min-height: clamp(360px, 46vh, 560px);
	background: color-mix(in srgb, var(--background) 52%, transparent);
	border-color: color-mix(in srgb, var(--primary) 34%, transparent);
}

.news-item--collapse {
	isolation: isolate;
	min-height: clamp(390px, 50vh, 580px);
	border-color: color-mix(in srgb, #ff4b32 66%, transparent);
	background: linear-gradient(135deg, color-mix(in srgb, #300d0b 88%, var(--background)) 0%, color-mix(in srgb, #0d111b 92%, var(--background)) 72%);
	box-shadow: inset 10px 0 0 #ff4b32, 0 24px 70px color-mix(in srgb, #180504 34%, transparent);
}

.news-item--collapse::before {
	content: "";
	position: absolute;
	inset: 0;
	z-index: -1;
	pointer-events: none;
	background-image:
		linear-gradient(color-mix(in srgb, #ff765e 10%, transparent) 1px, transparent 1px),
		linear-gradient(90deg, color-mix(in srgb, #ff765e 10%, transparent) 1px, transparent 1px),
		linear-gradient(115deg, transparent 55%, color-mix(in srgb, #ff4b32 12%, transparent) 55% 56%, transparent 56%);
	background-size: 38px 38px, 38px 38px, 100% 100%;
	mask-image: linear-gradient(90deg, black, transparent 92%);
}

.news-item--collapse:hover {
	border-color: #ff765e;
	background: linear-gradient(135deg, color-mix(in srgb, #3b100d 90%, var(--background)) 0%, color-mix(in srgb, #0d111b 94%, var(--background)) 72%);
}

.news-item--collapse .news-body {
	position: relative;
	z-index: 1;
	max-width: 760px;
	padding: clamp(1.5rem, 4vw, 3.6rem);
}

.news-item--collapse .news-meta,
.news-item--collapse .news-deck {
	color: color-mix(in srgb, #fff 72%, transparent);
}

.news-item--collapse .news-meta span,
.news-item--collapse .news-link {
	color: #ff8a69;
}

.news-item--collapse h3 {
	max-width: 820px;
	color: #fff7f1;
}

.collapse-signal {
	display: inline-flex;
	align-items: center;
	gap: 0.65rem;
	align-self: flex-start;
	margin-bottom: clamp(1.5rem, 4vw, 3rem);
	padding: 0.48rem 0.68rem;
	border: 1px solid color-mix(in srgb, #ff765e 55%, transparent);
	background: color-mix(in srgb, #160706 76%, transparent);
	color: #ffb09b;
	font-family: "Space Mono", monospace;
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.08em;
}

.news-deck {
	max-width: 680px;
	margin: 1.25rem 0 0;
	font-size: clamp(1rem, 1.6vw, 1.25rem);
	line-height: 1.65;
}

.news-item::after {
	content: "";
	position: absolute;
	inset: 0;
	pointer-events: none;
	background: linear-gradient(120deg, transparent 0%, color-mix(in srgb, var(--primary) 12%, transparent) 48%, transparent 100%);
	opacity: 0;
	transform: translateX(-100%);
	transition: opacity 180ms ease, transform 520ms ease;
}

.news-item:hover {
	transform: translateY(-6px);
	border-color: color-mix(in srgb, var(--primary) 42%, transparent);
	background: color-mix(in srgb, var(--background) 50%, transparent);
}

.news-item:hover::after {
	opacity: 1;
	transform: translateX(100%);
}

.news-item--text-only {
	grid-template-columns: 1fr;
	min-height: 0;
}

.news-image {
	aspect-ratio: 16 / 9;
	min-height: 0;
	background: color-mix(in srgb, var(--text-main) 6%, transparent);
}

.news-item--featured .news-image {
	order: 2;
	aspect-ratio: auto;
	height: 100%;
}

.news-image img {
	width: 100%;
	height: 100%;
	display: block;
	object-fit: cover;
}

.news-body {
	display: flex;
	flex-direction: column;
	padding: clamp(1.25rem, 3vw, 2.2rem);
	min-width: 0;
	min-height: 0;
}

.news-item--featured .news-body {
	justify-content: flex-end;
}

.news-item--text-only .news-body {
	padding: clamp(1rem, 2vw, 1.45rem);
}

.news-item--collapse.news-item--text-only {
	min-height: clamp(390px, 50vh, 580px);
}

.news-item--collapse.news-item--text-only .news-body {
	padding: clamp(1.5rem, 4vw, 3.6rem);
}

.news-meta {
	display: inline-flex;
	align-items: center;
	justify-content: flex-start;
	gap: 0.75rem;
	color: var(--text-secondary);
	font-size: 0.82rem;
	font-weight: 760;
}

.news-meta span {
	color: var(--primary);
}

.news-meta span::after {
	content: "/";
	margin-left: 0.75rem;
	color: var(--text-secondary);
	font-weight: 400;
}

.news-item h3 {
	margin: 1rem 0 0;
	color: var(--title-color);
	font-size: clamp(1.2rem, 2.2vw, 2rem);
	font-weight: 720;
	line-height: 1.16;
	overflow-wrap: anywhere;
}

.news-item--text-only h3 {
	font-size: clamp(1.05rem, 1.4vw, 1.35rem);
	line-height: 1.2;
}

.news-item--featured h3 {
	font-size: clamp(1.8rem, 4vw, 3.6rem);
	line-height: 1.04;
}

.news-link {
	display: inline-flex;
	align-items: center;
	gap: 0.7rem;
	align-self: flex-start;
	margin-top: auto;
	padding-top: 1.15rem;
	color: var(--primary);
	font-size: 0.92rem;
	font-weight: 700;
	text-decoration: none;
	transition: color 180ms ease, transform 180ms ease;
}

.news-link:hover {
	color: var(--primary-dark);
	transform: translateX(6px);
}

.news-link-arrow {
	position: relative;
	width: 28px;
	height: 1px;
	background: currentColor;
	transition: width 180ms ease;
}

.news-link-arrow::after {
	content: "";
	position: absolute;
	right: 0;
	top: 50%;
	width: 8px;
	height: 8px;
	border-right: 1px solid currentColor;
	border-top: 1px solid currentColor;
	transform: translateY(-50%) rotate(45deg);
}

.news-link:hover .news-link-arrow {
	width: 42px;
}

.home {
	position: relative;
	height: auto;
	min-height: 100%;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 1.7rem;
	overflow: visible;
	background: var(--page-background);
}

.shader-background {
	position: fixed;
	inset: 0;
	width: 100%;
	height: 100dvh;
	pointer-events: none;
	opacity: 1;
	animation: shader-in 900ms ease both;
}

@keyframes shader-in {
	from { opacity: 0; }
	to { opacity: 1; }
}

@keyframes hero-brand-in {
	from { opacity: 0; transform: translateY(10px); }
	to { opacity: 1; transform: translateY(0); }
}

@keyframes hero-title-in {
	from { opacity: 0; transform: translateY(24px); }
	to { opacity: 1; transform: translateY(0); }
}

@keyframes scroll-cue-in {
	from { opacity: 0; transform: translate(-50%, 8px); }
	to { opacity: 1; transform: translate(-50%, 0); }
}

@keyframes scroll-cue-pulse {
	0%, 100% { transform: translateY(-2px) rotate(45deg); opacity: 0.55; }
	50% { transform: translateY(4px) rotate(45deg); opacity: 1; }
}

:global(:root[data-theme='dark'] .home) {
	background: var(--page-background);
}

:global(:root[data-theme='dark'] .news-feed) {
}

@media (max-width: 980px) {
	.home-content {
		width: 100%;
		padding-inline: clamp(1rem, 4vw, 2rem);
	}

	.home-hero {
		min-height: calc(100dvh - var(--app-header-height, 128px));
	}

	.news-item {
		grid-template-columns: 1fr;
	}

	.news-item--featured .news-image {
		order: initial;
		aspect-ratio: 16 / 9;
		height: auto;
	}

	.news-image {
		aspect-ratio: 16 / 9;
		min-height: 0;
	}
}

@media (max-width: 640px) {
	.home-content {
		padding-inline: 1rem;
		padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
	}

	.home-footer {
		padding-bottom: 1rem;
	}

	.home-hero {
		min-height: calc(100dvh - var(--app-header-height, 108px));
		padding: 2.25rem 0 2rem;
	}

	.home-hero h1,
	.home--campaign .home-hero h1 {
		width: 100%;
		max-width: 100%;
		font-size: 2.45rem;
		line-height: 1.04;
		text-wrap: pretty;
	}

	.hero-brand {
		font-size: 1.1rem;
	}

	.news-feed {
		padding: 0;
	}

	.news-list {
		column-width: auto;
		column-count: 1;
	}

	.home-footer {
		align-items: flex-start;
		flex-direction: column;
	}

	.footer-links {
		justify-content: flex-start;
	}

	.shader-background {
		opacity: 0.72;
	}
}

@media (prefers-reduced-motion: reduce) {
	.shader-background {
		display: none;
	}

	.hero-brand,
	.home-hero h1,
	.scroll-cue,
	.scroll-cue-line {
		animation: none;
	}

	.reveal-item {
		opacity: 1;
		transform: none;
		transition: none;
	}
}
</style>
