<template>
	<div class="login-wrapper">
		<canvas ref="shaderCanvas" class="shader-background" aria-hidden="true"></canvas>
		<section class="login-copy">
			<h1>Quantum Original</h1>
			<p>{{ $t('auth.loginCopy') }}</p>
		</section>

		<section class="login-container" :aria-label="$t('auth.loginForm')">
			<header class="header">
				<h1>{{ $t("loginPage.welcome_back") }}</h1>
				<p>{{ $t("loginPage.login") }}</p>
			</header>

			<form @submit.prevent="login">
				<div class="input-group">
					<svg class="input-icon" viewBox="0 0 24 24">
						<path
							d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
					</svg>
					<input
						v-model="username"
						type="text"
						:placeholder="$t('auth.usernamePlaceholder')"
						autocomplete="username"
						required
					>
				</div>

				<div class="input-group">
					<svg class="input-icon" viewBox="0 0 24 24">
						<path
							d="M12,17C10.89,17 10,16.1 10,15C10,13.89 10.89,13 12,13C13.1,13 14,13.9 14,15C14,16.1 13.1,17 12,17M18,20V10H6V20H18M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V10C4,8.89 4.89,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
					</svg>
					<input
						v-model="password"
						type="password"
						:placeholder="$t('auth.passwordPlaceholder')"
						autocomplete="current-password"
						required
					>
				</div>

				<button type="submit" :disabled="loading">
					<span v-if="!loading">{{ $t("loginPage.now_login") }}</span>
					<div v-else class="spinner"></div>
				</button>

				<div v-if="errorMessage" class="error-message">
					{{ errorMessage }}
				</div>

				<p class="register-hint">
					{{ $t('auth.noAccount') }}
					<router-link to="/register">{{ $t('auth.goRegister') }}</router-link>
				</p>
			</form>
		</section>
	</div>
</template>

<script setup>
import {onBeforeUnmount, onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {post} from '/src/utils/request.js'

const router = useRouter()
const {t} = useI18n()
const username = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)
const shaderCanvas = ref(null)
let animationFrame = 0
let cleanupShader = () => {}
let shaderTheme = 0
const shaderFrameInterval = 1000 / 32
const shaderTimeScale = 2.0

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

	if (!vertexShader || !fragmentShader) return null

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

	if (!canvas || reduceMotionQuery?.matches) return

	const gl = canvas.getContext('webgl', {
		antialias: false,
		alpha: true,
		depth: false,
		stencil: false,
		preserveDrawingBuffer: false,
		powerPreference: 'low-power',
	})

	if (!gl) return

	const vertexSource = `
		attribute vec2 a_position;
		void main() {
			gl_Position = vec4(a_position, 0.0, 1.0);
		}
	`

	const fragmentSource = `
		precision mediump float;

		uniform vec2 u_resolution;
		uniform float u_time;
		uniform float u_theme;
		varying vec2 v_uv;

		// 4x4 Bayer Dither Matrix for retro pixel art shading
		float getBayer4(vec2 coord) {
			vec2 b = mod(coord, 4.0);
			float x = floor(b.x);
			float y = floor(b.y);
			if (y == 0.0) {
				return (x == 0.0 ? 0.0 : x == 1.0 ? 8.0 : x == 2.0 ? 2.0 : 10.0) / 16.0;
			} else if (y == 1.0) {
				return (x == 0.0 ? 12.0 : x == 1.0 ? 4.0 : x == 2.0 ? 14.0 : 6.0) / 16.0;
			} else if (y == 2.0) {
				return (x == 0.0 ? 3.0 : x == 1.0 ? 11.0 : x == 2.0 ? 1.0 : 9.0) / 16.0;
			} else {
				return (x == 0.0 ? 15.0 : x == 1.0 ? 7.0 : x == 2.0 ? 13.0 : 5.0) / 16.0;
			}
		}

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
			// Pixel art block size (larger retro pixels)
			float pixelSize = 10.0;
			vec2 pixelCoord = floor(gl_FragCoord.xy / pixelSize);
			vec2 snappedCoord = (pixelCoord + 0.5) * pixelSize;

			vec2 uv = snappedCoord / u_resolution.xy;
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
			float rawDensity = haze * 0.40 + smoke * 0.60;

			// Boost contrast curve for punchy pixel clusters
			float shapedDensity = smoothstep(0.10, 0.88, rawDensity);
			shapedDensity = pow(shapedDensity, 1.15);

			// Apply Bayer matrix ordered dithering
			float dither = (getBayer4(pixelCoord) - 0.5) * 0.22;
			float dithered = clamp(shapedDensity + dither, 0.0, 1.0);

			// Quantize into 6 discrete color palette steps
			float level = floor(dithered * 6.0) / 6.0;

			float edgeFalloff = 0.88 + 0.12 * smoothstep(1.4, 0.1, length(p));

			// High-Contrast Retro Pixel Palette: Dark mode (deep space & midnight tones)
			vec3 c0_dark = vec3(0.003, 0.006, 0.015); // Deep Void
			vec3 c1_dark = vec3(0.008, 0.024, 0.070); // Deep Indigo
			vec3 c2_dark = vec3(0.018, 0.060, 0.160); // Midnight Cobalt
			vec3 c3_dark = vec3(0.035, 0.120, 0.320); // Quantum Blue
			vec3 c4_dark = vec3(0.070, 0.240, 0.520); // Cyber Azure
			vec3 c5_dark = vec3(0.140, 0.400, 0.700); // Electric Azure Accent

			// Soothing & Non-glaring Pixel Palette: Light mode (gentle, eye-friendly pastel sky & soft slate tones)
			vec3 c0_light = vec3(0.90, 0.93, 0.96); // Soft Cloud Haze
			vec3 c1_light = vec3(0.83, 0.88, 0.93); // Light Sky Tint
			vec3 c2_light = vec3(0.76, 0.83, 0.90); // Muted Ice Blue
			vec3 c3_light = vec3(0.68, 0.77, 0.86); // Soft Periwinkle
			vec3 c4_light = vec3(0.60, 0.70, 0.81); // Calm Slate Blue
			vec3 c5_light = vec3(0.52, 0.63, 0.76); // Gentle Denim Accent

			vec3 c0 = mix(c0_light, c0_dark, u_theme);
			vec3 c1 = mix(c1_light, c1_dark, u_theme);
			vec3 c2 = mix(c2_light, c2_dark, u_theme);
			vec3 c3 = mix(c3_light, c3_dark, u_theme);
			vec3 c4 = mix(c4_light, c4_dark, u_theme);
			vec3 c5 = mix(c5_light, c5_dark, u_theme);

			vec3 color = c0;
			float alpha = 0.0;

			if (level < 0.166) {
				color = c0;
				alpha = mix(0.55, 0.68, level * 6.0);
			} else if (level < 0.333) {
				color = c1;
				alpha = mix(0.68, 0.78, (level - 0.166) * 6.0);
			} else if (level < 0.500) {
				color = c2;
				alpha = mix(0.78, 0.86, (level - 0.333) * 6.0);
			} else if (level < 0.666) {
				color = c3;
				alpha = mix(0.86, 0.92, (level - 0.500) * 6.0);
			} else if (level < 0.833) {
				color = c4;
				alpha = mix(0.92, 0.96, (level - 0.666) * 6.0);
			} else {
				color = c5;
				alpha = 0.98;
			}

			// Floating quantum pixel motes / sparkles
			vec2 starGrid = floor((pixelCoord + vec2(t * 1.2, -t * 1.8)) / 9.0);
			float starSeed = hash(starGrid * 5.43);
			if (starSeed > 0.968) {
				vec2 localGrid = mod(pixelCoord + vec2(t * 1.2, -t * 1.8), 9.0);
				if (floor(localGrid.x) == 4.0 && floor(localGrid.y) == 4.0) {
					float pulse = sin(t * 3.5 + starSeed * 50.0) * 0.5 + 0.5;
					if (pulse > 0.4) {
						vec3 sparkColor = mix(c4, c5, pulse);
						color = mix(color, sparkColor, pulse);
					}
				}
			}

			// Soft subtle pixel grid texture (gentle in light mode, crisp in dark mode)
			vec2 frac = fract(gl_FragCoord.xy / pixelSize);
			float gridFactor = mix(0.96, 0.88, u_theme);
			float grid = (frac.x < 0.06 || frac.y < 0.06) ? gridFactor : 1.0;
			color *= grid;

			// Reading zone mask to gently soften background behind content
			float textZone = smoothstep(0.0, 0.90, length(vec2(p.x + 0.25, p.y * 1.4)));
			alpha *= mix(0.82, 1.0, textZone);

			alpha *= edgeFalloff * mix(0.88, 0.95, u_theme);

			gl_FragColor = vec4(color, alpha);
		}
	`
	const program = createProgram(gl, vertexSource, fragmentSource)
	if (!program) return

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
	let shouldRender = true
	let isLoopRunning = false
	let needsResize = true
	let lastFrameTime = 0

	const syncTheme = () => {
		shaderTheme = document.documentElement.dataset.theme === 'dark' ? 1 : 0
	}

	const resize = () => {
		const dpr = Math.min(window.devicePixelRatio || 1, 1.2)
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
		shouldRender = document.visibilityState === 'visible'

		if (shouldRender) {
			startRenderLoop()
		} else {
			cancelAnimationFrame(animationFrame)
			isLoopRunning = false
		}
	}

	const syncVisibility = () => updateRenderState()
	const themeObserver = new MutationObserver(syncTheme)

	window.addEventListener('resize', requestResize, {passive: true})
	document.addEventListener('visibilitychange', syncVisibility)
	themeObserver.observe(document.documentElement, {attributeFilter: ['data-theme']})
	syncTheme()
	renderFrame()
	startRenderLoop()

	cleanupShader = () => {
		cancelAnimationFrame(animationFrame)
		window.removeEventListener('resize', requestResize)
		document.removeEventListener('visibilitychange', syncVisibility)
		themeObserver.disconnect()
		gl.deleteBuffer(positionBuffer)
		gl.deleteProgram(program)
	}
}

const login = async () => {
	errorMessage.value = ''
	loading.value = true

	try {
		const response = await post('https://api.qoriginal.vip/qo/game/login', {
			username: username.value,
			password: password.value,
			web: true,
		})

		if (response.result) {
			localStorage.setItem('username', username.value)
			localStorage.setItem('token', response.token)

			const requestedRedirect = router.currentRoute.value.query.redirect
			const redirect = typeof requestedRedirect === 'string' && requestedRedirect.startsWith('/')
				? requestedRedirect
				: '/'
			router.push(redirect).then(() => window.location.reload())
		} else {
			errorMessage.value = t('loginPage.err_user')
		}
	} catch (error) {
		errorMessage.value = t('loginPage.err_network')
		console.error('登录失败:', error)
	} finally {
		loading.value = false
	}
}

onMounted(initShaderBackground)

onBeforeUnmount(() => {
	cleanupShader()
})
</script>


<style scoped>
.login-wrapper {
	position: relative;
	min-height: calc(100dvh - var(--app-header-height, 0px));
	display: grid;
	grid-template-columns: minmax(0, 580px) minmax(380px, 480px);
	align-items: center;
	gap: clamp(1.5rem, 5vw, 4rem);
	padding: clamp(1rem, 5vw, 4rem);
	background: var(--page-background);
	overflow: hidden;
	box-sizing: border-box;
	justify-content: center;
}

.shader-background {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	opacity: 1;
	image-rendering: -webkit-optimize-contrast;
	image-rendering: crisp-edges;
	image-rendering: pixelated;
}

.login-copy,
.login-container {
	position: relative;
	z-index: 1;
}

.login-copy {
	max-width: 580px;
	align-self: center;
}

.login-copy h1 {
	margin: 0;
	color: var(--title-color);
	font-size: clamp(2.6rem, 8vw, 6.4rem);
	font-weight: 420;
	line-height: 1.02;
}

.login-copy p {
	max-width: 560px;
	margin: 1rem 0 0;
	color: var(--text-secondary);
	font-size: clamp(1rem, 2.4vw, 1.45rem);
	line-height: 1.55;
}

.login-container {
	background: color-mix(in srgb, var(--background) 94%, transparent);
	border: 1px solid color-mix(in srgb, var(--text-main) 14%, transparent);
	padding: 1.5rem;
	width: 100%;
	box-sizing: border-box;
}

.header {
	text-align: left;
	padding-bottom: 1rem;
	border-bottom: 1px solid color-mix(in srgb, var(--text-main) 14%, transparent);
	margin-bottom: 1rem;
}

.header h1 {
	color: var(--title-color);
	font-size: 1.55rem;
	line-height: 1.2;
	margin: 0;
}

.header p {
	color: var(--text-secondary);
	font-size: 0.95rem;
	margin: 0.35rem 0 0;
	line-height: 1.5;
}

form {
	display: grid;
	gap: 0.85rem;
}

.input-group {
	display: flex;
	align-items: center;
	border: 1px solid color-mix(in srgb, var(--text-main) 14%, transparent);
	background: var(--background-secondary);
	padding: 0 1rem;
	min-height: 52px;
	transition: border-color 0.18s ease;
}

.input-group:focus-within {
	border-color: var(--primary);
}

.input-icon {
	width: 21px;
	height: 21px;
	fill: var(--primary);
	margin-right: 0.75rem;
	flex-shrink: 0;
}

.input-group input {
	border: none;
	background: transparent;
	color: var(--text-main);
	flex: 1;
	min-width: 0;
	padding: 0.95rem 0;
	font-size: 1rem;
	outline: none;
}

.input-group input::placeholder {
	color: var(--text-secondary);
}


input:focus {
	outline: none;
}

button {
	width: 100%;
	min-height: 52px;
	padding: 0.95rem 1rem;
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
	border: 1px solid var(--primary);
	border-radius: 0;
	font-size: 1rem;
	font-weight: 700;
	cursor: pointer;
	transition: background-color 0.18s ease;
	margin-top: 0.15rem;
}

button:hover:not(:disabled) {
	background: var(--button-primary-hover);
}

button:disabled {
	opacity: 0.7;
	cursor: not-allowed;
}

.error-message {
	color: var(--error);
	font-size: 0.9rem;
	margin-top: 0.15rem;
	text-align: left;
	border: 1px solid color-mix(in srgb, var(--error) 45%, transparent);
	background: color-mix(in srgb, var(--error) 10%, transparent);
	padding: 0.78rem 0.85rem;
}

.register-hint {
	margin: 0.3rem 0 0;
	color: var(--text-secondary);
	font-size: 0.92rem;
	line-height: 1.5;
	text-align: center;
}

.register-hint a {
	color: var(--primary);
	font-weight: 700;
	text-decoration: none;
}

.register-hint a:hover {
	text-decoration: underline;
}

.spinner {
	width: 24px;
	height: 24px;
	margin: 0 auto;
	border: 3px solid color-mix(in srgb, var(--button-primary-text) 28%, transparent);
	border-top-color: var(--button-primary-text);
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

:global(:root[data-theme='dark'] .login-wrapper) {
	background: var(--page-background);
}

.login-wrapper :deep(*) {
	user-select: text;
}

@media (max-width: 860px) {
	.login-wrapper {
		grid-template-columns: 1fr;
		align-content: center;
		justify-items: center;
		gap: 1.5rem;
	}

	.login-copy {
		width: min(100%, 480px);
	}

	.login-container {
		max-width: 480px;
	}
}

@media (max-width: 520px) {
	.login-wrapper {
		padding: 1rem;
		min-height: calc(100dvh - var(--app-header-height, 0px));
	}

	.login-container {
		padding: 1rem;
	}

	.login-copy h1 {
		font-size: clamp(2.1rem, 15vw, 3.7rem);
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
