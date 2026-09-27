import {homeFragmentSource, homeVertexSource} from './homeShaderSources.js'

const shaderFrameInterval = 1000 / 36
const shaderTimeScale = 2.2

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

export function initHomeShaderBackground(canvas) {
	let animationFrame = 0
	let shaderTheme = 0
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

	const program = createProgram(gl, homeVertexSource, homeFragmentSource)
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

	return () => {
		cancelAnimationFrame(animationFrame)
		window.removeEventListener('resize', requestResize)
		document.removeEventListener('visibilitychange', syncVisibility)
		visibilityObserver.disconnect()
		themeObserver.disconnect()
		gl.deleteBuffer(positionBuffer)
		gl.deleteProgram(program)
	}
}
