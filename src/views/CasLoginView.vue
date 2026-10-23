<template>
	<main class="cas-login">
		<h1>{{ $t('loginPage.sso_authorizing') }}</h1>
		<p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
		<button v-if="errorMessage" type="button" @click="startLogin">
			{{ $t('loginPage.cas_link') }}
		</button>
	</main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { QoAuthClient, LocalStorageTokenStorage, extractTicketFromUrl, stripTicketFromUrl } from '@quantumoriginal/login-sdk'
import { postLoginRedirect } from '@/utils/loginRedirect.js'
import { prepareQhubCallback, consumeQhubCallback } from '@/utils/casCallback.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.qoriginal.vip'
const auth = new QoAuthClient({
	apiBaseUrl: API_BASE_URL,
	authPortalUrl: import.meta.env.VITE_CAS_PORTAL_URL || 'https://qoriginal.vip/cas',
	clientId: 'qcommunity',
	storage: new LocalStorageTokenStorage(''),
})

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const errorMessage = ref('')

function redirectAfterLogin(username) {
	localStorage.setItem('username', username)
	localStorage.setItem('qhub.auth.method', 'cas')
	const redirect = postLoginRedirect(route.query.redirect)
	router.replace(redirect)
}

async function refreshSavedToken() {
	try {
		const user = await auth.refreshSession()
		localStorage.setItem('username', user.user)
		return user
	} catch (error) {
		if (error.code === 'INVALID_TOKEN' || error.code === 'ACCOUNT_FROZEN') {
			await auth.logout()
			localStorage.removeItem('username')
			return null
		}
		throw error
	}
}

function callbackServiceUrl() {
	return prepareQhubCallback(window.location.origin, postLoginRedirect(route.query.redirect))
}

function startLogin() {
	errorMessage.value = ''
	try {
		auth.redirectToLogin(callbackServiceUrl())
	} catch (error) {
		errorMessage.value = error.message || t('loginPage.err_network')
	}
}

onMounted(async () => {
	try {
		const callbackUrl = window.location.href
		const ticket = extractTicketFromUrl(callbackUrl)
		if (new URL(callbackUrl).searchParams.has('ticket')) {
			window.history.replaceState(window.history.state, '', stripTicketFromUrl(callbackUrl))
			if (!consumeQhubCallback(callbackUrl)) throw new Error(t('casAuth.callbackMismatch'))
			await auth.logout()
			localStorage.removeItem('username')
			localStorage.removeItem('qhub.auth.method')
			const callbackUser = await auth.validateTicket(ticket || '', callbackUrl)
			redirectAfterLogin(callbackUser.user)
			return
		}

		if (localStorage.getItem('qhub.auth.method') === 'cas' && await auth.getToken()) {
			const savedSession = await refreshSavedToken()
			if (savedSession) {
				redirectAfterLogin(savedSession.user)
				return
			}
		}

		auth.redirectToLogin(callbackServiceUrl())
	} catch (error) {
		errorMessage.value = error.message || t('loginPage.err_network')
	}
})
</script>

<style scoped>
.cas-login {
	min-height: 60vh;
	display: grid;
	place-content: center;
	gap: 1rem;
	padding: 2rem;
	color: var(--text-main);
	text-align: center;
}
</style>
