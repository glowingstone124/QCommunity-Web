import googleSansUrl from '@/assets/GoogleSans-Regular.ttf?url'
import interUrl from '@/assets/Inter-VariableFont_opsz,wght.ttf?url'
import spaceMonoUrl from '@/assets/SpaceMono-Regular.ttf?url'
import bahnschriftUrl from '@/assets/bahnschrift.ttf?url'

const CORE_ASSETS = [
	{
		type: 'font',
		family: 'Inter',
		url: interUrl,
		descriptors: { weight: '100 900', style: 'normal' },
	},
	{
		type: 'font',
		family: 'GSans',
		url: googleSansUrl,
		descriptors: { weight: '400', style: 'normal' },
	},
	{
		type: 'font',
		family: 'SpaceMono',
		url: spaceMonoUrl,
		descriptors: { weight: '400', style: 'normal' },
	},
	{
		type: 'font',
		family: 'Bahnschrift',
		url: bahnschriftUrl,
		descriptors: { weight: '400', style: 'normal' },
	},
	{
		type: 'image',
		url: '/favicon.svg',
	},
]

const FETCH_TIMEOUT = 10000

function createTimeoutSignal() {
	if (!('AbortController' in window)) {
		return { signal: undefined, cancel: () => {} }
	}

	const controller = new AbortController()
	const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT)

	return {
		signal: controller.signal,
		cancel: () => window.clearTimeout(timeoutId),
	}
}

async function fetchArrayBuffer(url, onProgress) {
	const { signal, cancel } = createTimeoutSignal()

	try {
		const response = await fetch(url, { cache: 'force-cache', signal })

		if (!response.ok) {
			throw new Error(`Failed to load ${url}: ${response.status}`)
		}

		const contentLength = Number(response.headers.get('content-length')) || 0

		if (!response.body || !contentLength) {
			const buffer = await response.arrayBuffer()
			onProgress(1)
			return buffer
		}

		const reader = response.body.getReader()
		const chunks = []
		let receivedLength = 0

		while (true) {
			const { done, value } = await reader.read()

			if (done) {
				break
			}

			chunks.push(value)
			receivedLength += value.length
			onProgress(Math.min(receivedLength / contentLength, 1))
		}

		const buffer = new Uint8Array(receivedLength)
		let position = 0

		for (const chunk of chunks) {
			buffer.set(chunk, position)
			position += chunk.length
		}

		onProgress(1)
		return buffer.buffer
	} finally {
		cancel()
	}
}

async function loadFont(asset, onProgress) {
	const buffer = await fetchArrayBuffer(asset.url, onProgress)

	if (!('FontFace' in window)) {
		return
	}

	const font = new FontFace(asset.family, buffer, asset.descriptors)
	await font.load()
	document.fonts.add(font)
}

async function loadStaticAsset(asset, onProgress) {
	if (asset.type === 'font') {
		await loadFont(asset, onProgress)
		return
	}

	await fetchArrayBuffer(asset.url, onProgress)
}

export async function loadCoreAssets(onProgress = () => {}) {
	const assetProgress = new Array(CORE_ASSETS.length).fill(0)

	const report = (index, progress) => {
		assetProgress[index] = Math.max(assetProgress[index], progress)
		const loaded = assetProgress.reduce((total, value) => total + value, 0)
		onProgress(Math.round((loaded / CORE_ASSETS.length) * 100))
	}

	onProgress(0)

	await Promise.allSettled(
		CORE_ASSETS.map((asset, index) =>
			loadStaticAsset(asset, progress => report(index, progress)).finally(() => report(index, 1)),
		),
	)

	onProgress(100)
}
