import { postLoginRedirect } from './loginRedirect.js'

export class SessionExpiredError extends Error {
	constructor() {
		super('The saved session is invalid or expired')
		this.name = 'SessionExpiredError'
		this.code = 'INVALID_TOKEN'
	}
}

export function isInvalidSessionResponse(status, data) {
	return status === 401 || data?.code === 'INVALID_TOKEN' || data?.error?.code === 'INVALID_TOKEN'
		|| data?.error === 1 || data?.error === 3
}

export function clearQhubSession(storage = localStorage) {
	for (const key of ['token', 'username', 'user', 'qhub.auth.method']) storage.removeItem(key)
}

export function redirectInvalidSession(token, location = window.location, storage = localStorage) {
	// A late response from an old request must not clear a newer session.
	if (!token || storage.getItem('token') !== token) return false
	clearQhubSession(storage)
	const redirect = postLoginRedirect(location.pathname + location.search + location.hash)
	location.replace(`/login?redirect=${encodeURIComponent(redirect)}`)
	return true
}
