<template>
	<div class="login-wrapper">
		<div class="login-container">
			<div class="header">
				<h1>{{ $t("loginPage.welcome_back") }}</h1>
				<p>{{ $t("loginPage.login") }}</p>
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
						placeholder="用户名"
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
						placeholder="密码"
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
			</form>
		</div>
	</div>
</template>

<script setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {get} from '/src/utils/request.js'

const router = useRouter()
const username = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

const login = async () => {
	errorMessage.value = ''
	loading.value = true

	try {
		const url = `/api/qo/game/login?username=${encodeURIComponent(username.value)}&password=${encodeURIComponent(password.value)}&web=true`
		const response = await get(url)

		if (response.result) {
			localStorage.setItem('username', username.value)
			localStorage.setItem('token', response.token)

			router.push('/').then(() => window.location.reload())
		} else {
			errorMessage.value = '用户名或密码错误，请重试'
		}
	} catch (error) {
		errorMessage.value = '网络连接错误，请稍后再试'
		console.error('登录失败:', error)
	} finally {
		loading.value = false
	}
}
</script>


<style scoped>
.login-wrapper {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 2rem;
	background: var(--background);
}

.login-container {
	background: var(--card-background);
	border-radius: 20px;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
	padding: 2.5rem;
	width: 100%;
	max-width: 450px;
	transform: translateY(-10%);
	backdrop-filter: blur(10px);
}

.header {
	text-align: center;
	margin-bottom: 2rem;
}

.header h1 {
	color: var(--title-color);
	font-size: 2rem;
	margin-bottom: 0.5rem;
}

.header p {
	color: var(--text-secondary);
	font-size: 0.95rem;
}

.input-group {
	display: flex;
	align-items: center;
	border: 2px solid var(--split);
	border-radius: 10px;
	padding: 0 1rem;
	margin-top: 2rem;
}

.input-icon {
	width: 24px;
	height: 24px;
	fill: var(--primary);
	margin-right: 0.5rem;
	flex-shrink: 0;
}

.input-group input {
	border: none;
	background: transparent;
	flex: 1;
	padding: 1rem 2rem;
	font-size: 1rem;
}


input:focus {
	border-color: var(--primary);
	box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
	outline: none;
	background: var(--background);
}

button {
	width: 100%;
	padding: 1rem;
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
	border: none;
	border-radius: 23px;
	font-size: 1.1rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.3s ease;
	margin-top: 1rem;
}

button:hover:not(:disabled) {
	background: var(--button-primary-hover);
	box-shadow: 0 5px 15px rgba(37, 99, 235, 0.3);
}

button:disabled {
	opacity: 0.7;
	cursor: not-allowed;
}

.error-message {
	color: var(--error);
	font-size: 0.9rem;
	margin-top: 1rem;
	text-align: center;
	animation: shake 0.5s ease;
}

.spinner {
	width: 24px;
	height: 24px;
	margin: 0 auto;
	border: 3px solid rgba(37, 99, 235, 0.3);
	border-top-color: var(--button-primary-text);
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

@keyframes shake {
	0%, 100% {
		transform: translateX(0);
	}
	25% {
		transform: translateX(-5px);
	}
	75% {
		transform: translateX(5px);
	}
}

@media (max-width: 480px) {
	.login-container {
		padding: 1.5rem;
		border-radius: 15px;
	}

	input {
		padding: 0.8rem 0.8rem 0.8rem 2.5rem;
	}

	.input-icon {
		width: 20px;
		height: 20px;
		left: 0.8rem;
	}
}
</style>
