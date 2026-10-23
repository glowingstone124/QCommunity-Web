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
import { QoAuthClient, LocalStorageTokenStorage } from '@quantumoriginal/login-sdk'
import { postLoginRedirect } from '@/utils/loginRedirect.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.qoriginal.vip'
const auth = new QoAuthClient({
	apiBaseUrl: API_BASE_URL,
	authPortalUrl: 'https://qoriginal.vip/login',
	clientId: 'qcommunity',
	storage: new LocalStorageTokenStorage(''),
})

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const errorMessage = ref('')

function redirectAfterLogin(username) {
	localStorage.setItem('username', username)
	const redirect = postLoginRedirect(route.query.redirect)
	router.replace(redirect).then(() => window.location.reload())
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

function startLogin() {
	errorMessage.value = ''
	try {
		auth.redirectToLogin()
	} catch (error) {
		errorMessage.value = error.message || t('loginPage.err_network')
	}
}

onMounted(async () => {
	try {
		const callbackUser = await auth.handleCallback()
		if (callbackUser) {
			redirectAfterLogin(callbackUser.user)
			return
		}

		if (await auth.getToken()) {
			const savedSession = await refreshSavedToken()
			if (savedSession) {
				redirectAfterLogin(savedSession.user)
				return
			}
		}

		auth.redirectToLogin()
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
