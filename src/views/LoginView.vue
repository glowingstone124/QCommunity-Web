<template>
	<div class="login-wrapper">
		<LoginShaderBackground />
		<section class="login-copy">
			<h1>Quantum Original</h1>
			<p>{{ $t('auth.loginCopy') }}</p>
		</section>

		<section class="login-container" :aria-label="$t('auth.loginForm')">
			<header class="header">
				<h1>{{ $t("loginPage.welcome_back") }}</h1>
				<p>{{ $t("loginPage.login") }}</p>
			</header>

			<div v-if="targetService" class="sso-service-badge">
				<div class="sso-badge-header">
					<svg class="sso-badge-icon" viewBox="0 0 24 24">
						<path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.89,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
					</svg>
					<span>{{ $t("loginPage.sso_target") }}</span>
				</div>
				<div class="sso-badge-url">{{ ssoServiceDisplay }}</div>
			</div>

			<form @submit.prevent="login">
				<div class="input-group">
					<svg class="input-icon" viewBox="0 0 24 24">
						<path
							d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
					</svg>
					<input
						v-model="username"
						type="text"
						:placeholder="$t('auth.usernamePlaceholder')"
						autocomplete="username"
						required
					>
				</div>

				<div class="input-group">
					<svg class="input-icon" viewBox="0 0 24 24">
						<path
							d="M12,17C10.89,17 10,16.1 10,15C10,13.89 10.89,13 12,13C13.1,13 14,13.9 14,15C14,16.1 13.1,17 12,17M18,20V10H6V20H18M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V10C4,8.89 4.89,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
					</svg>
					<input
						v-model="password"
						type="password"
						:placeholder="$t('auth.passwordPlaceholder')"
						autocomplete="current-password"
						required
					>
				</div>

				<button type="submit" :disabled="loading">
					<span v-if="!loading">{{ $t("loginPage.now_login") }}</span>
					<div v-else class="spinner"></div>
				</button>

				<div v-if="errorMessage" class="error-message">
					{{ errorMessage }}
				</div>

				<p class="register-hint">
					{{ $t('auth.noAccount') }}
					<router-link to="/register">{{ $t('auth.goRegister') }}</router-link>
				</p>
			</form>
		</section>
	</div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { post } from '/src/utils/request.js'
import LoginShaderBackground from '@/components/auth/LoginShaderBackground.vue'
import { useCasAuth } from '@/composables/useCasAuth.js'

const router = useRouter()
const { t } = useI18n()
const username = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

const { targetService, ssoServiceDisplay, grantTicket, trySilentSso } = useCasAuth()

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.qoriginal.vip'

const login = async () => {
	errorMessage.value = ''
	loading.value = true

	try {
		const response = await post(`${API_BASE_URL}/qo/game/login`, {
			username: username.value,
			password: password.value,
			web: true,
		})

		if (response.result) {
			localStorage.setItem('username', username.value)
			localStorage.setItem('token', response.token)

			if (targetService.value) {
				const redirectUrl = await grantTicket(response.token, targetService.value)
				if (redirectUrl) {
					window.location.href = redirectUrl
					return
				}
			}

			const requestedRedirect = router.currentRoute.value.query.redirect
			const redirect = typeof requestedRedirect === 'string' && requestedRedirect.startsWith('/')
				? requestedRedirect
				: '/'
			router.push(redirect).then(() => window.location.reload())
		} else {
			errorMessage.value = t('loginPage.err_user')
		}
	} catch (error) {
		errorMessage.value = t('loginPage.err_network')
		console.error('登录失败:', error)
	} finally {
		loading.value = false
	}
}

onMounted(async () => {
	const currentToken = localStorage.getItem('token')
	if (currentToken && targetService.value) {
		loading.value = true
		try {
			await trySilentSso(currentToken)
		} finally {
			loading.value = false
		}
	}
})
</script>

<style scoped>
.login-wrapper {
	position: relative;
	min-height: calc(100dvh - var(--app-header-height, 0px));
	display: grid;
	grid-template-columns: minmax(0, 580px) minmax(380px, 480px);
	align-items: center;
	gap: clamp(1.5rem, 5vw, 4rem);
	padding: clamp(1rem, 5vw, 4rem);
	background: var(--page-background);
	overflow: hidden;
	box-sizing: border-box;
	justify-content: center;
}

.login-copy,
.login-container {
	position: relative;
	z-index: 1;
}

.login-copy {
	max-width: 580px;
	align-self: center;
}

.login-copy h1 {
	margin: 0;
	color: var(--title-color);
	font-size: clamp(2.6rem, 8vw, 6.4rem);
	font-weight: 420;
	line-height: 1.02;
}

.login-copy p {
	max-width: 560px;
	margin: 1rem 0 0;
	color: var(--text-secondary);
	font-size: clamp(1rem, 2.4vw, 1.45rem);
	line-height: 1.55;
}

.login-container {
	background: color-mix(in srgb, var(--background) 94%, transparent);
	border: 1px solid color-mix(in srgb, var(--text-main) 14%, transparent);
	padding: 1.5rem;
	width: 100%;
	box-sizing: border-box;
}

.header {
	text-align: left;
	padding-bottom: 1rem;
	border-bottom: 1px solid color-mix(in srgb, var(--text-main) 14%, transparent);
	margin-bottom: 1rem;
}

.header h1 {
	color: var(--title-color);
	font-size: 1.55rem;
	line-height: 1.2;
	margin: 0;
}

.header p {
	color: var(--text-secondary);
	font-size: 0.95rem;
	margin: 0.35rem 0 0;
	line-height: 1.5;
}

.sso-service-badge {
	margin-bottom: 1.15rem;
	padding: 0.75rem 0.95rem;
	border: 1px solid color-mix(in srgb, var(--primary) 35%, transparent);
	background: color-mix(in srgb, var(--primary) 8%, var(--background-secondary));
	display: flex;
	flex-direction: column;
	gap: 0.3rem;
}

.sso-badge-header {
	display: flex;
	align-items: center;
	gap: 0.45rem;
	font-size: 0.82rem;
	color: var(--text-secondary);
}

.sso-badge-icon {
	width: 15px;
	height: 15px;
	fill: var(--primary);
	flex-shrink: 0;
}

.sso-badge-url {
	font-family: monospace;
	font-size: 0.92rem;
	font-weight: 500;
	color: var(--primary);
	word-break: break-all;
}

form {
	display: grid;
	gap: 0.85rem;
}

.input-group {
	display: flex;
	align-items: center;
	border: 1px solid color-mix(in srgb, var(--text-main) 14%, transparent);
	background: var(--background-secondary);
	padding: 0 1rem;
	min-height: 52px;
	transition: border-color 0.18s ease;
}

.input-group:focus-within {
	border-color: var(--primary);
}

.input-icon {
	width: 21px;
	height: 21px;
	fill: var(--primary);
	margin-right: 0.75rem;
	flex-shrink: 0;
}

.input-group input {
	border: none;
	background: transparent;
	color: var(--text-main);
	flex: 1;
	min-width: 0;
	padding: 0.95rem 0;
	font-size: 1rem;
	outline: none;
}

.input-group input::placeholder {
	color: var(--text-secondary);
}

input:focus {
	outline: none;
}

button {
	width: 100%;
	min-height: 52px;
	padding: 0.95rem 1.25rem;
	background: var(--primary);
	color: var(--background);
	border: none;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: filter 0.18s ease;
	display: flex;
	justify-content: center;
	align-items: center;
}

button:hover:not(:disabled) {
	filter: brightness(1.1);
}

button:disabled {
	opacity: 0.7;
	cursor: not-allowed;
}

.spinner {
	width: 18px;
	height: 18px;
	border: 2px solid var(--background);
	border-top-color: transparent;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.error-message {
	color: #ef4444;
	font-size: 0.9rem;
	margin: 0.25rem 0 0;
	text-align: left;
}

.register-hint {
	margin: 0.75rem 0 0;
	text-align: left;
	font-size: 0.9rem;
	color: var(--text-secondary);
}

.register-hint a {
	color: var(--primary);
	text-decoration: underline;
	margin-left: 0.25rem;
}

@media (max-width: 980px) {
	.login-wrapper {
		grid-template-columns: 1fr;
		gap: 2rem;
		align-content: center;
		padding: 1.5rem;
	}

	.login-copy {
		text-align: center;
	}

	.login-copy p {
		margin-left: auto;
		margin-right: auto;
	}

	.login-container {
		max-width: 480px;
		margin: 0 auto;
	}
}
</style>
