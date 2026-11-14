export function buildOptionalAuthHeaders(baseHeaders = {}, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
	const headers = { ...baseHeaders }
	const token = storage?.getItem?.('token')
	if (token) {
		headers.Authorization = `Bearer ${token}`
		headers.token = token
	}
	return headers
}

export function normalizeAccountType(accountData, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
	const type = accountData?.account_type === 'ta' || accountData?.temp === true ? 'ta' : 'qo'
	if (storage?.setItem) {
		storage.setItem('account_type', type)
	}
	return type
}

export function isTaSession(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
	return storage?.getItem?.('account_type') === 'ta'
}

export function computeTaUpgradeState(accountData) {
	const accountType = accountData?.account_type === 'ta' || accountData?.temp === true ? 'ta' : 'qo'
	const playtime = Math.max(0, Number(accountData?.playtime || 0))
	const requiredPlaytime = Math.max(1, Number(accountData?.required_playtime || 180))
	const remainingMinutes = Math.max(0, requiredPlaytime - playtime)
	const progressPercent = Math.min(100, Math.round((playtime / requiredPlaytime) * 100))
	return {
		accountType,
		playtime,
		requiredPlaytime,
		remainingMinutes,
		progressPercent,
		canUpgrade: playtime >= requiredPlaytime,
	}
}

export function parseTaRestrictedResponse(status, payload) {
	const isRestricted = status === 403 && (
		payload?.error === 'ta_restricted'
		|| payload?.code === 403
		|| (typeof payload?.message === 'string' && payload.message.includes('Thulium'))
	)
	return {
		restricted: isRestricted,
		message: isRestricted && typeof payload?.message === 'string' ? payload.message : '',
	}
}

export function isValidQqNumber(qq) {
	return /^[1-9][0-9]{4,10}$/.test(String(qq ?? '').trim())
}
