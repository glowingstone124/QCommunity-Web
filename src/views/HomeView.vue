<script setup>
import {computed, onBeforeUnmount, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {loadNewsFeed} from '@/utils/newsFeed'

const {locale, t} = useI18n()
const shaderCanvas = ref(null)
const newsItems = ref([])
let animationFrame = 0
let cleanupShader = () => {}
let shaderTheme = 0
let newsRefreshTimer = 0
const shaderFrameInterval = 1000 / 36
const shaderTimeScale = 2.2

const localizedNews = computed(() =>
	newsItems.value.map((item) => ({
		...item,
		type: item.type[locale.value] || item.type.zh,
		title: item.title[locale.value] || item.title.zh,
		description: item.description[locale.value] || item.description.zh,
	}))
)

async function syncNewsFeed() {
	newsItems.value = await loadNewsFeed()
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
			vec3 ink = vec3(0.03, 0.06, 0.11);
			vec3 blue = vec3(0.05, 0.16, 0.42);
			vec3 cyan = vec3(0.12, 0.30, 0.48);
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

onMounted(() => {
	initShaderBackground()
	syncNewsFeed()
	newsRefreshTimer = window.setInterval(syncNewsFeed, 15000)
})

onBeforeUnmount(() => {
	window.clearInterval(newsRefreshTimer)
	cleanupShader()
})
</script>

<template>
	<div class="home page-shell">
		<canvas ref="shaderCanvas" class="shader-background" aria-hidden="true"></canvas>
		<div class="home-content">
			<section class="home-hero" aria-labelledby="home-title">
				<div class="hero-copy">
					<h1 id="home-title">{{ t('homePage.hero_title') }}</h1>
					<p class="hero-description">{{ t('homePage.hero_description') }}</p>
				</div>
				<a class="scroll-cue" href="#home-news" :aria-label="t('homePage.scroll_to_feed')">
					<span>{{ t('homePage.scroll_to_feed') }}</span>
					<span class="scroll-cue-line" aria-hidden="true"></span>
				</a>
			</section>

			<section id="home-news" class="news-feed" aria-labelledby="news-title">

				<div class="news-list">
					<article v-for="item in localizedNews" :key="item.id" class="news-item" :class="{ 'news-item--text-only': !item.image }">
						<div v-if="item.image" class="news-image">
							<img :src="item.image" :alt="item.title" loading="lazy">
						</div>
						<div class="news-body">
							<div class="news-meta">
								<span>{{ item.type }}</span>
								<time :datetime="item.date">{{ item.date }}</time>
							</div>
							<h3>{{ item.title }}</h3>
							<p>{{ item.description }}</p>
							<router-link :to="item.to" class="news-link">
								<span>{{ t('homePage.read_more') }}</span>
								<span class="news-link-arrow" aria-hidden="true"></span>
							</router-link>
						</div>
					</article>
				</div>
			</section>
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
	padding: 0 clamp(1rem, 4vw, 3rem) clamp(8rem, 20vh, 20rem);
	box-sizing: border-box;
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	align-content: start;
	gap: clamp(4rem, 10vh, 8rem);
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
	gap: 1.25rem;
}

.home-hero h1 {
	margin: 0;
	color: var(--title-color);
	font-size: clamp(3rem, 9vw, 8.4rem);
	font-weight: 520;
	line-height: 0.98;
	white-space: nowrap;
}

.hero-description {
	max-width: 920px;
	margin: 0;
	color: #d8dade;
	font-size: clamp(1.05rem, 2.4vw, 1.75rem);
	font-weight: 420;
	line-height: 1.55;
}

:global(:root[data-theme='light'] .hero-description) {
	color: #1e2534;
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
}

.scroll-cue-line::after {
	content: none;
}

.news-feed {
	width: 100%;
	padding: clamp(1.25rem, 3vw, 2.5rem);
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
	display: grid;
	grid-template-columns: 1fr;
	gap: clamp(1.5rem, 3vw, 2.25rem);
}

.news-item {
	position: relative;
	display: grid;
	grid-template-columns: minmax(280px, 36%) minmax(0, 1fr);
	min-height: clamp(340px, 40vh, 520px);
	background: color-mix(in srgb, var(--background) 42%, transparent);
	border: 1px solid color-mix(in srgb, var(--text-main) 12%, transparent);
	backdrop-filter: blur(16px) saturate(115%);
	overflow: hidden;
	transition: transform 220ms ease, border-color 220ms ease, background-color 220ms ease;
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
}

.news-image {
	min-height: 100%;
	background: color-mix(in srgb, var(--text-main) 6%, transparent);
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
	padding: clamp(1.6rem, 4vw, 3.4rem);
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
	margin: 1.35rem 0 0;
	color: var(--title-color);
	font-size: clamp(1.35rem, 2.8vw, 2.45rem);
	font-weight: 720;
	line-height: 1.16;
}

.news-item p {
	margin: 1.1rem 0 0;
	color: var(--text-secondary);
	font-size: clamp(0.92rem, 1.15vw, 1.05rem);
	font-weight: 430;
	line-height: 1.6;
	max-width: 72ch;
}

.news-link {
	display: inline-flex;
	align-items: center;
	gap: 0.7rem;
	align-self: flex-start;
	margin-top: auto;
	padding-top: 1.5rem;
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
	height: 100%;
	min-height: 0;
	display: flex;
	flex-direction: column;
	gap: 1.7rem;
	overflow: auto;
	background: var(--page-background);
}

.shader-background {
	position: fixed;
	inset: 0;
	width: 100%;
	height: 100dvh;
	pointer-events: none;
	opacity: 1;
}

:global(:root[data-theme='dark'] .home) {
	background: var(--page-background);
}

:global(:root[data-theme='dark'] .news-feed) {
}

:global(:root[data-theme='dark'] .hero-description) {
	color: #d8dade;
}

@media (max-width: 980px) {
	.home-hero {
		min-height: auto;
	}

	.news-item,
	.news-item--text-only {
		grid-template-columns: 1fr;
	}

	.news-image {
		aspect-ratio: 16 / 9;
		min-height: 0;
	}
}

@media (max-width: 640px) {
	.home-hero h1 {
		white-space: normal;
		overflow-wrap: anywhere;
	}

	.news-feed {
		padding: 1rem;
	}

	.shader-background {
		opacity: 0.72;
	}
}

@media (prefers-reduced-motion: reduce) {
	.shader-background {
		display: none;
	}
}
</style>
