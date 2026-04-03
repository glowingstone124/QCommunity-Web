<template>
	<header class="app-header">
		<div class="header-content">
			<button type="button" class="logo-section" @click="goHome">
				<h1 class="logo-text">{{ pageStore.currentPage }}</h1>
			</button>

			<div class="user-section">
				<button v-if="!loggedIn" type="button" class="login-alert" @click="goToLogin">
					<span class="alert-icon">⚠️</span>
					<span class="alert-text">点击此处登录</span>
				</button>

				<div v-if="loggedIn" class="user-info">
					<span class="user-name">{{ username }}</span>
					<span class="user-role">{{ $t('mainPage.greeting_text', { played: playtime }) }}</span>
				</div>

				<button v-if="loggedIn" type="button" class="avatar-container" @click="toggleUserMenu">
					<img :src="avatarUrl" alt="User Avatar" class="user-avatar" />
					<span class="avatar-label">{{ $t('mainPage.account_center') }}</span>
				</button>

				<div class="header-actions">
					<button
						type="button"
						class="theme-btn"
						:title="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'"
						@click="toggleTheme"
					>
						{{ theme === 'dark' ? '🌙' : '☀️' }}
					</button>
					<button type="button" class="lang-btn" @click="toggleLang">
						{{ locale === 'zh' ? 'EN' : '中文' }}
					</button>
				</div>
			</div>
		</div>
	</header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePageStore } from '@/utils/store.ts'
import { useHeaderProfile } from '@/composables/useHeaderProfile.js'

const router = useRouter()
const { locale } = useI18n()
const pageStore = usePageStore()
const { avatarUrl, loggedIn, playtime, theme, username } = useHeaderProfile()

const goHome = () => {
	router.push('/')
}

const toggleUserMenu = () => {
	router.push('/account')
}

const goToLogin = () => {
	router.push('/login')
}

const toggleLang = () => {
	locale.value = locale.value === 'zh' ? 'en' : 'zh'
	localStorage.setItem('locale', locale.value)
}

const toggleTheme = () => {
	theme.value = theme.value === 'dark' ? 'light' : 'dark'
	document.documentElement.dataset.theme = theme.value
	localStorage.setItem('theme', theme.value)
}
</script>

<style scoped>
.app-header {
	width: 100%;
	min-height: var(--app-header-height);
	background-color: var(--primary);
	box-shadow: 0 2px 10px rgba(15, 23, 42, 0.12);
}

.header-content {
	width: min(1280px, 100%);
	min-height: var(--app-header-height);
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin: 0 auto;
	padding: 0 1rem;
	gap: 1rem;
}

.logo-section {
	cursor: pointer;
	border: none;
	background: transparent;
	padding: 0;
}

.logo-text {
	font-size: clamp(1.1rem, 2vw, 1.5rem);
	font-weight: bold;
	color: var(--button-primary-text);
	margin: 0;
	text-align: left;
}

.user-section {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-left: auto;
}

.user-info {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
}

.user-name {
	font-weight: 600;
	color: var(--button-primary-text);
}

.user-role {
	font-size: 0.8em;
	color: color-mix(in srgb, var(--button-primary-text) 70%, transparent);
}

.avatar-container {
	display: flex;
	align-items: center;
	gap: 0.55rem;
	border: 1px solid rgba(255, 255, 255, 0.28);
	background: rgba(255, 255, 255, 0.08);
	padding: 0.35rem 0.85rem 0.35rem 0.35rem;
	border-radius: 999px;
	cursor: pointer;
}

.avatar-label {
	color: var(--button-primary-text);
	font-size: 0.9em;
	white-space: nowrap;
}

.user-avatar {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	flex-shrink: 0;
}

.login-alert {
	background: var(--error);
	color: white;
	padding: 0.6rem 0.95rem;
	border-radius: 999px;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	border: none;
}

.alert-text {
	font-weight: 500;
	font-size: 0.95rem;
}

.header-actions {
	display: flex;
	align-items: center;
	gap: 0.55rem;
}

.lang-btn,
.theme-btn {
	padding: 0.6rem 0.8rem;
	font-size: 0.9rem;
	cursor: pointer;
	border-radius: 14px;
}

.lang-btn {
	background: var(--primary-dark);
	color: var(--button-primary-text);
	border: none;
}

.lang-btn:hover {
	background: var(--primary);
}

.theme-btn {
	background: var(--button-secondary-bg);
	color: var(--button-secondary-text);
	border: 1px solid var(--button-secondary-border);
}

.theme-btn:hover {
	background: var(--button-secondary-hover);
}

@media (max-width: 860px) {
	.header-content {
		padding: 0.75rem 1rem;
		align-items: flex-start;
	}

	.user-section {
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.user-info {
		display: none;
	}

	.avatar-label {
		display: none;
	}
}

@media (max-width: 640px) {
	.header-content {
		flex-direction: column;
	}

	.logo-section,
	.user-section {
		width: 100%;
	}

	.user-section {
		justify-content: space-between;
	}

	.login-alert {
		flex: 1;
		justify-content: center;
	}
}
</style>
