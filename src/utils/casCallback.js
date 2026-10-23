const PENDING_SERVICE_KEY = 'qhub.cas.service'

export function prepareQhubCallback(origin, redirect, storage = sessionStorage) {
	const service = new URL('/login', origin)
	service.searchParams.set('redirect', redirect)
	service.searchParams.set('state', crypto.randomUUID())
	storage.setItem(PENDING_SERVICE_KEY, service.href)
	return service.href
}

export function consumeQhubCallback(callbackUrl, storage = sessionStorage) {
	const service = new URL(callbackUrl)
	service.searchParams.delete('ticket')
	const expected = storage.getItem(PENDING_SERVICE_KEY)
	storage.removeItem(PENDING_SERVICE_KEY)
	return !!expected && service.href === expected
}
