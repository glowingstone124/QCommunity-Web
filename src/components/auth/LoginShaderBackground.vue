<template>
	<canvas ref="shaderCanvas" class="shader-background" aria-hidden="true"></canvas>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

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

			float shapedDensity = smoothstep(0.10, 0.88, rawDensity);
			shapedDensity = pow(shapedDensity, 1.15);

			float dither = (getBayer4(pixelCoord) - 0.5) * 0.22;
			float dithered = clamp(shapedDensity + dither, 0.0, 1.0);

			float level = floor(dithered * 6.0) / 6.0;
			float edgeFalloff = 0.88 + 0.12 * smoothstep(1.4, 0.1, length(p));

			vec3 c0_dark = vec3(0.003, 0.006, 0.015);
			vec3 c1_dark = vec3(0.008, 0.024, 0.070);
			vec3 c2_dark = vec3(0.018, 0.060, 0.160);
			vec3 c3_dark = vec3(0.035, 0.120, 0.320);
			vec3 c4_dark = vec3(0.070, 0.240, 0.520);
			vec3 c5_dark = vec3(0.140, 0.400, 0.700);

			vec3 c0_light = vec3(0.90, 0.93, 0.96);
			vec3 c1_light = vec3(0.83, 0.88, 0.93);
			vec3 c2_light = vec3(0.76, 0.83, 0.90);
			vec3 c3_light = vec3(0.68, 0.77, 0.86);
			vec3 c4_light = vec3(0.60, 0.70, 0.81);
			vec3 c5_light = vec3(0.52, 0.63, 0.76);

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

			vec2 frac = fract(gl_FragCoord.xy / pixelSize);
			float gridFactor = mix(0.96, 0.88, u_theme);
			float grid = (frac.x < 0.06 || frac.y < 0.06) ? gridFactor : 1.0;
			color *= grid;

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

	window.addEventListener('resize', requestResize, { passive: true })
	document.addEventListener('visibilitychange', syncVisibility)
	themeObserver.observe(document.documentElement, { attributeFilter: ['data-theme'] })
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

onMounted(initShaderBackground)

onBeforeUnmount(() => {
	cleanupShader()
})
</script>

<style scoped>
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
</style>
