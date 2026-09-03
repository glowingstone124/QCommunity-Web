const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://api.glowingstone.cn').replace(/\/$/, '')

/**
 * Fetch one-off server status via standard HTTP GET
 * @param {number|string} serverId
 * @returns {Promise<object>}
 */
export async function fetchServerStatus(serverId = 1) {
	const response = await fetch(`${API_BASE_URL}/qo/download/status?id=${encodeURIComponent(serverId)}`, {
		headers: {
			Accept: 'application/json',
		},
		cache: 'no-store',
	})

	if (!response.ok) {
		throw new Error(`Server status request failed: HTTP ${response.status}`)
	}

	return response.json()
}

/**
 * Subscribe to live server status updates via Server-Sent Events (SSE)
 * @param {number|string} serverId
 * @param {object} callbacks
 * @param {(data: object) => void} callbacks.onMessage
 * @param {(error: any) => void} [callbacks.onError]
 * @param {() => void} [callbacks.onOpen]
 * @returns {{ close: () => void }}
 */
export function subscribeServerStatus(serverId = 1, { onMessage, onError, onOpen } = {}) {
	if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
		let isTerminated = false
		const poll = async () => {
			if (isTerminated) return
			try {
				const data = await fetchServerStatus(serverId)
				if (!isTerminated && onMessage) onMessage(data)
			} catch (err) {
				if (!isTerminated && onError) onError(err)
			}
		}

		poll()
		const timer = setInterval(poll, 3000)
		return {
			close() {
				isTerminated = true
				clearInterval(timer)
			},
		}
	}

	const streamUrl = `${API_BASE_URL}/qo/download/status/stream?id=${encodeURIComponent(serverId)}`
	const eventSource = new EventSource(streamUrl)

	eventSource.onopen = () => {
		if (onOpen) onOpen()
	}

	eventSource.onmessage = (event) => {
		try {
			if (!event.data) return
			const parsed = JSON.parse(event.data)
			if (onMessage) onMessage(parsed)
		} catch (err) {
			console.error('Failed to parse status SSE event:', err)
		}
	}

	eventSource.addEventListener('status', (event) => {
		try {
			if (!event.data) return
			const parsed = JSON.parse(event.data)
			if (onMessage) onMessage(parsed)
		} catch (err) {
			console.error('Failed to parse named status SSE event:', err)
		}
	})

	eventSource.onerror = (err) => {
		if (onError) onError(err)
	}

	return {
		close() {
			eventSource.close()
		},
	}
}
