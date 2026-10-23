// Keep login completion on this site and avoid reloading the CAS callback forever.
export function postLoginRedirect(value) {
	if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\s]/.test(value)) {
		return '/'
	}
	try {
		const target = new URL(value, 'https://qoriginal.vip')
		if (target.origin !== 'https://qoriginal.vip' || /^\/cas\/*$/i.test(decodeURIComponent(target.pathname))) {
			return '/'
		}
		return target.pathname + target.search + target.hash
	} catch {
		return '/'
	}
}
