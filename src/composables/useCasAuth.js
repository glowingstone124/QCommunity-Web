import { computed } from 'vue'
import { useRoute } from 'vue-router'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.qoriginal.vip'

export function useCasAuth() {
	const route = useRoute()

	const targetService = computed(() => {
		const s = route?.query?.service
		return typeof s === 'string' && s.trim().length > 0 ? s.trim() : null
	})

	const ssoServiceDisplay = computed(() => {
		if (!targetService.value) return ''
		try {
			const parsed = new URL(targetService.value)
			return parsed.origin + (parsed.pathname !== '/' ? parsed.pathname : '')
		} catch {
			return targetService.value
		}
	})

	async function grantTicket(token, service) {
		if (!token || !service) return null
		try {
			const res = await fetch(`${API_BASE_URL}/qo/auth/ticket/grant`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
				body: JSON.stringify({ service }),
			})
			if (res.ok) {
				const data = await res.json()
				if (data.result && data.redirectUrl) {
					return data.redirectUrl
				}
			} else if (res.status === 401) {
				localStorage.removeItem('token')
				localStorage.removeItem('username')
			}
		} catch (e) {
			console.error('SSO grant ticket failed:', e)
		}
		return null
	}

	async function trySilentSso(token) {
		const service = targetService.value
		if (!service || !token) return false
		const redirectUrl = await grantTicket(token, service)
		if (redirectUrl) {
			window.location.href = redirectUrl
			return true
		}
		return false
	}

	return {
		targetService,
		ssoServiceDisplay,
		grantTicket,
		trySilentSso,
	}
}
