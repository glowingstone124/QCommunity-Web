import { isInvalidSessionResponse, SessionExpiredError } from '@/utils/authSession.js'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://api.qoriginal.vip').replace(/\/$/, '')

export async function fetchSessionAccount(token) {
	const response = await fetch(`${API_BASE_URL}/qo/authorization/account`, {
		cache: 'no-store',
		headers: { token },
	})
	if (response.status === 401) throw new SessionExpiredError()
	const account = await response.json()
	if (isInvalidSessionResponse(response.status, account)) throw new SessionExpiredError()
	if (!response.ok) throw new Error(`Account lookup failed: ${response.status}`)
	if (!account?.username?.trim() || account.error) throw new Error('Could not identify the signed-in account')
	return account
}
