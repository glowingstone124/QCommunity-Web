<script setup>
import {ref, onMounted} from 'vue';
import { useI18n } from 'vue-i18n'
import {post} from "@/utils/request.js";

const username = ref(localStorage.getItem('username') || "");
const token = ref(localStorage.getItem('token') || "");
const password = ref('');
const loginstat = ref(false);
const playtime = ref(0);
const { t } = useI18n()
onMounted(() => {
	if (username) {
		fetch("https://api.qoriginal.vip/qo/authorization/account", {
			headers: {
				"token": token.value
			}
		}).then(res => res.json())
			.then(data => {
				if (data.error === 3 || data.error === 1) {
					loginstat.value = false
					return
				}
				loginstat.value = true
				username.value = data.username;
				playtime.value = data.playtime;
			});
	}
});

function logout() {
	loginstat.value = false;
	localStorage.removeItem('username');
}

function accountcenter() {
	document.location.href = loginstat.value ? "/account" : "/login";
}

function login() {
	post('https://api.glowingstone.cn/qo/game/login', {
		username: username.value,
		password: password.value,
		web: true,
	}).then(result => {
		if (result.result === true) {
			localStorage.setItem("username", username.value);
			localStorage.setItem("token", result.token);
			loginstat.value = true;
		} else {
			alert(t('legacyPersonal.loginFailed'));
		}
	}).catch(error => {
		console.error('登录请求发生错误:', error.message);
		alert(t('legacyPersonal.loginRequestFailed'));
	});
}
</script>

<template>
	<div class="personal">
		<h1 class="username">{{ loginstat ? username : t('legacyPersonal.login') }}</h1>
		<p v-if="loginstat">
			{{ t('legacyPersonal.played', { count: playtime }) }}
		</p>
		<span v-if="loginstat"
			  style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <a class="link" @click="accountcenter">{{ t('legacyPersonal.account') }}</a>
            <a class="link" @click="logout">{{ t('legacyPersonal.logout') }}</a>
        </span>
		<span v-else style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <form @submit.prevent="login" autocomplete="off" class="login-container">
                <input type="text" v-model="username" :placeholder="t('legacyPersonal.username')" required/>
                <input type="password" v-model="password" :placeholder="t('legacyPersonal.password')" required/>
				<a href="/register">{{ t('legacyPersonal.noAccount') }}</a>
                <button type="submit">{{ t('legacyPersonal.login') }}</button>
            </form>
        </span>
	</div>
</template>

<style scoped>
@import '/src/assets/main.css';

.username {
	font-size: 3.5rem;
	margin-top: 0;
	margin-bottom: 0;
	font-weight: 800;
	font-family: 'Inter', sans-serif;
}

a {
	background-color: var(--button-secondary-bg);
	text-decoration: none;
	border-radius: 15px;
	color: var(--button-secondary-text);
	border: 1px solid var(--button-secondary-border);
	padding: 10px 15px;
}

h1, p {
	color: var(--text-main);
}

.link {
	text-decoration: none;
	background: var(--button-primary-bg);
	margin-top: 20px;
	padding: 30px 80px;
	border-radius: 20px;
	color: var(--button-primary-text);
}

.link:hover {
	background-color: var(--button-primary-hover) !important;
	cursor: pointer;
}

.personal {
	background: var(--card-background);
	padding: 50px 50px;
	border-radius: 30px;
	font-family: 'Bahnschrift', sans-serif;
	display: flex;
	flex-direction: column;
	* {
		transition: 0.3s all ease-in-out;
	}
}

.login-container {
	width: 300px;
	margin: auto;
	padding: 20px;
	border-radius: 8px;
}

input[type="text"],
input[type="password"] {
	color: var(--text-main);
	display: block;
	width: 100%;
	border: none;
	border-bottom: 3px solid var(--primary);
	padding: 2vh;
	font-size: 16px;
	margin-bottom: 10px;
	box-sizing: border-box;
	background-color: var(--background-secondary) !important;
	transition: border-bottom 0.3s ease-in-out;
}

input[type="text"]:focus,
input[type="password"]:focus {
	outline: none;
	border-bottom: 4px solid var(--primary);
}

input[type="text"]::placeholder,
input[type="password"]::placeholder {
	color: var(--text-secondary);
	opacity: 1;
}

button {
	width: 100%;
	padding: 20px;
	margin-top: 20px;
	background-color: var(--button-primary-bg);
	color: var(--button-primary-text);
	border: none;
	border-radius: 40px;
	cursor: pointer;
	font-size: 16px;
	transition: background-color 0.3s ease-in-out;
}

button:hover {
	background-color: var(--button-primary-hover);
}

@media (max-width: 480px) {
	.personal {
		padding: 20px 40px;
		max-width: 90%;
		margin: auto;
	}

	.username {
		font-size: 1.4rem;
	}

	.link {
		padding: 20px 20px;
	}

	input {
		max-width: 100%;
		margin-top: 20px;
	}

	.login-container {
		margin: 0;
		padding: 0;
		max-width: 100%
	}

	button {
		max-width: 100%;
	}
}
</style>
