const CACHE_KEY = 'qhub:card-catalog:v1'
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000

export function readCardCatalogCache() {
	try {
		const raw = localStorage.getItem(CACHE_KEY)
		if (!raw) return null

		const cached = JSON.parse(raw)
		if (!Array.isArray(cached?.cards) || Date.now() - cached.savedAt > MAX_CACHE_AGE) {
			localStorage.removeItem(CACHE_KEY)
			return null
		}

		return cached.cards
	} catch {
		return null
	}
}

export function writeCardCatalogCache(cards) {
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), cards }))
	} catch {
		// Storage can be unavailable or full. The network response remains usable.
	}
}
