<script setup>
import {computed, onBeforeUnmount, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {homeTiles} from '@/data/home'

const {t} = useI18n()
const shaderCanvas = ref(null)
let animationFrame = 0
let cleanupShader = () => {}
let shaderTheme = 0
const shaderFrameInterval = 1000 / 36
const shaderTimeScale = 2.2

const localizedTiles = computed(() =>
	homeTiles.map((item) => ({
		...item,
		title: t(item.titleKey),
		description: t(item.descriptionKey),
	}))
)


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

onMounted(initShaderBackground)

onBeforeUnmount(() => {
	cleanupShader()
})
</script>

<template>
	<div class="home page-shell">
		<canvas ref="shaderCanvas" class="shader-background" aria-hidden="true"></canvas>
		<section class="tips">
			<h1>我们正在筹备中。</h1>
			<h2>Quantum Original 的官网正在经历新一轮样式调整。您现在看到的页面是 Beta 版本，可能并不反映原始内容。</h2>
		</section>
	</div>
</template>

<style scoped>
.tips {
	position: relative;
	z-index: 1;
	width: min(1280px, 100%);
	min-height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: flex-start;
	gap: 1rem;
	margin: 0 auto;
	padding: clamp(2rem, 8vh, 6rem) clamp(1rem, 5vw, 2rem);
	box-sizing: border-box;
}

.tips h1 {
	margin: 0;
	color: var(--title-color);
	font-size: clamp(2.4rem, 10vw, 7.2rem);
	font-weight: 400;
	line-height: 1.05;
	white-space: nowrap;
}

.tips h2 {
	max-width: 760px;
	margin: 0;
	color: var(--text-secondary);
	font-size: clamp(1rem, 3.5vw, 1.9rem);
	font-weight: 300;
	line-height: 1.55;
}

.home {
	position: relative;
	height: 100%;
	min-height: 0;
	display: flex;
	flex-direction: column;
	gap: 1.7rem;
	overflow: auto;
	background:
		linear-gradient(180deg, color-mix(in srgb, var(--background) 86%, #0f172a), color-mix(in srgb, var(--background) 92%, #0f172a)),
		color-mix(in srgb, var(--background-secondary) 78%, #0f172a);
}

.shader-background {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	opacity: 1;
}

:global(:root[data-theme='dark']) .home {
	background:
		linear-gradient(180deg, color-mix(in srgb, var(--background) 78%, #0f172a), color-mix(in srgb, var(--background) 86%, #0f172a)),
		color-mix(in srgb, var(--background-secondary) 72%, #0f172a);
}

.tiles {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
	gap: 1rem;
}

@media (max-width: 640px) {
	.tips {
		justify-content: flex-start;
		padding: 2rem 1rem;
	}

	.tips h1 {
		white-space: normal;
		overflow-wrap: anywhere;
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
