<template>
	<header class="app-header">
		<div class="header-content">
			<div class="logo-section">
				<h1 class="logo-text" @click="goHome">{{ pageStore.currentPage }}</h1>
			</div>

			<div class="user-section">
				<div v-if="!loginstat" class="login-alert" @click="goToLogin">
					<span class="alert-icon">⚠️</span>
					<span class="alert-text">点击此处登录</span>
				</div>
				<div class="user-info" v-if="loginstat">
					<span class="user-name">{{ username }}</span>
					<span class="user-role">{{ $t("mainPage.greeting_text", {played: playtime}) }}</span>
				</div>
				<div v-if="loginstat" class="avatar-container" @click="toggleUserMenu">
					<img
						:src="avatarUrl"
						alt="User Avatar"
						class="user-avatar"
						@click="toggleUserMenu"
					>
					<p v-if="loginstat" @click="toggleUserMenu">{{ $t("mainPage.account_center") }}</p>
				</div>
				<button class="theme-btn" @click="toggleTheme" :title="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'">
					{{ theme === "dark" ? "🌙" : "☀️" }}
				</button>
				<button class="lang-btn" @click="toggleLang">
					{{ locale === "zh" ? "EN" : "中文" }}
				</button>
			</div>
		</div>
	</header>
</template>

<script setup>
import {ref, onMounted} from 'vue'
import {useRouter} from 'vue-router'
import {useI18n} from "vue-i18n";
import {usePageStore} from "@/utils/store.ts";

const router = useRouter()
const {locale} = useI18n();
const username = ref(localStorage.getItem('username') || "")
const token = ref(localStorage.getItem('token') || "")
const loginstat = ref(false)
const playtime = ref(0)
const avatarUrl = ref('https://example.com/avatar.jpg')
const pageStore = usePageStore()
const theme = ref("light")

onMounted(() => {
	theme.value = document.documentElement.dataset.theme || "light"
	if (username.value) {
		fetch("https://api.qoriginal.vip/qo/authorization/account", {
			headers: {
				"token": token.value
			}
		}).then(res => res.json())
			.then(data => {
				if (data.error === 3 || data.error === 1) {
					getAvatar("steve")
					loginstat.value = false
					username.value = "未登录"
					return
				}
				loginstat.value = true
				username.value = data.username
				playtime.value = data.playtime
				getAvatar(data.username)
			})
	} else {
		username.value = "未登录"
		getAvatar("steve")
	}
})

function getAvatar(name) {
	fetch("https://api.qoriginal.vip/qo/download/avatar?name=" + name).then(res => res.json())
		.then(data => {
			avatarUrl.value = data.url
		})
}

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
	locale.value = locale.value === "zh" ? "en" : "zh";
	localStorage.setItem("locale", locale.value);
};

const toggleTheme = () => {
	theme.value = theme.value === "dark" ? "light" : "dark";
	document.documentElement.dataset.theme = theme.value;
	localStorage.setItem("theme", theme.value);
};
</script>

<style scoped>
.app-header {
	top: 0;
	left: 0;
	width: 100%;
	height: 60px;
	background-color: var(--primary);
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	z-index: 1000;
}

.header-content {
	display: flex;
	justify-content: space-between;
	align-items: center;
	height: 100%;
	margin: 0 auto;
	padding: 0 1rem;
}

.logo-section {
	cursor: pointer;
}

.logo-text {
	font-size: 24px;
	font-weight: bold;
	color: var(--button-primary-text);
	margin: 0;
}

.user-section {
	display: flex;
	align-items: center;
	gap: 10px;
}

.user-info {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
}

.user-name {
	font-weight: 500;
	color: var(--button-primary-text);
}

.user-role {
	font-size: 0.8em;
	color: var(--primary-light);
}

.user-avatar {
	width: 40px;
	height: 40px;
	cursor: pointer;
	border-radius: 50%;
	transition: transform 0.2s;
}

.user-avatar:hover {
	transform: scale(1.05);
}

.avatar-container {
	display: flex;
	align-items: center;
	border: 2px solid var(--button-primary-text);
	padding-right: 20px;
	border-radius: 30px;
	gap: 5px;
}

.avatar-container p {
	margin: 0;
	color: var(--button-primary-text);
	font-size: 0.9em;
}

.login-alert {
	background: var(--error);
	color: white;
	padding: 8px 15px;
	border-radius: 20px;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 8px;
	transition: all 0.3s;
}

.login-alert:hover {
	background: var(--error);
}

.alert-icon {
	font-size: 16px;
}

.alert-text {
	font-weight: 500;
	font-size: 0.95rem;
}

@keyframes pulse {
	0% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.05);
	}
	100% {
		transform: scale(1);
	}
}

@media (max-width: 768px) {
	.logo-text {
		font-size: 20px;
	}

	.user-info {
		display: none;
	}

	.avatar-container p {
		display: none;
	}

	.login-alert {
		padding: 6px 12px;
		font-size: 0.9em;
	}

	.user-avatar {
		width: 35px;
		height: 35px;
	}
}

@media (max-width: 480px) {
	.header-content {
		padding: 0 0.5rem;
	}

	.logo-text {
		font-size: 18px;
	}

	.login-alert {
		padding: 5px 10px;
		font-size: 0.8em;
	}

	.user-avatar {
		width: 30px;
		height: 30px;
	}
}

.lang-btn {
	background: var(--primary-dark);
	color: var(--button-primary-text);
	border: none;
	padding: 8px 12px;
	font-size: 14px;
	cursor: pointer;
	border-radius: 15px;
	transition: background 0.3s;
}

.lang-btn:hover {
	background: var(--primary);
}

.theme-btn {
	background: var(--button-secondary-bg);
	color: var(--button-secondary-text);
	border: 1px solid var(--button-secondary-border);
	padding: 8px 10px;
	font-size: 14px;
	cursor: pointer;
	border-radius: 12px;
	transition: background 0.3s;
}

.theme-btn:hover {
	background: var(--button-secondary-hover);
}
</style>
