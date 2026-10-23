import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { CAS_TOKEN_KEY, grantServiceTicket } from '@/utils/casPortal.js'
import { prepareQhubCallback } from '@/utils/casCallback.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.qoriginal.vip'

export function useCasPortal(username, password, isCallback, qqMode) {
	const route = useRoute()
	const { t } = useI18n()
	const errorMessage = ref('')
	const loading = ref(false)
	const targetService = computed(() => typeof route.query.service === 'string' && route.query.service.trim()
		? route.query.service.trim() : prepareQhubCallback(window.location.origin, '/'))
	const ssoServiceDisplay = computed(() => {
		try {
			const service = new URL(targetService.value)
			return service.origin + service.pathname
		} catch { return targetService.value }
	})

	async function completeLogin(token) {
		try {
			const redirect = await grantServiceTicket(API_BASE_URL, token, targetService.value)
			localStorage.setItem(CAS_TOKEN_KEY, token)
			window.location.replace(redirect)
		} catch (error) {
			if (error.status === 401 || error.status === 403) localStorage.removeItem(CAS_TOKEN_KEY)
			errorMessage.value = error.message || t('loginPage.err_network')
			throw error
		}
	}

	async function login() {
		if (loading.value) return
		loading.value = true
		errorMessage.value = ''
		try {
			const response = await fetch(`${API_BASE_URL}/qo/game/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: username.value, password: password.value, web: true }),
			})
			const data = await response.json()
			if (!response.ok || !data.result || !data.token) throw new Error(t('loginPage.err_user'))
			await completeLogin(data.token)
		} catch (error) {
			errorMessage.value = error.message || t('loginPage.err_network')
		} finally {
			password.value = ''
			loading.value = false
		}
	}

	onMounted(async () => {
		if (isCallback.value || qqMode.value) return
		const token = localStorage.getItem(CAS_TOKEN_KEY)
		if (!token) return
		loading.value = true
		try { await completeLogin(token) } catch { /* Show the portal for a fresh login. */ }
		finally { loading.value = false }
	})

	return { targetService, ssoServiceDisplay, errorMessage, loading, completeLogin, login }
}
