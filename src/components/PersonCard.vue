<script setup>
import {ref, onMounted} from 'vue';
import {get} from "@/utils/request.js";

const username = ref(localStorage.getItem('username') || "");
const token = ref(localStorage.getItem('token') || "");
const password = ref('');
const loginstat = ref(false);
const playtime = ref(0);
onMounted(() => {
	if (username) {
		fetch("/api/qo/authorization/account", {
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
	const url = `https://api.glowingstone.cn/qo/game/login?username=${username.value}&password=${password.value}`;
	get(url).then(result => {
		if (result.result === true) {
			localStorage.setItem("username", username.value);
			localStorage.setItem("token", result.token);
			loginstat.value = true;
		} else {
			alert("登录失败，请检查用户名和密码！");
		}
	}).catch(error => {
		console.error('登录请求发生错误:', error.message);
		alert("登录请求发生错误，请稍后再试。");
	});
}
</script>

<template>
	<div class="personal">
		<h1 class="username">{{ loginstat ? username : "登录" }}</h1>
		<p v-if="loginstat">
			您已经游玩了<span style="font-size: 2rem">{{ playtime }}</span>分钟
		</p>
		<span v-if="loginstat"
			  style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <a class="link" @click="accountcenter">账户中心</a>
            <a class="link" @click="logout">退出登录</a>
        </span>
		<span v-else style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <form @submit.prevent="login" autocomplete="off" class="login-container">
                <input type="text" v-model="username" placeholder="用户名" required/>
                <input type="password" v-model="password" placeholder="密码" required/>
				<a href="/register">还没有账号？注册一个!</a>
                <button type="submit">登录</button>
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
	box-shadow: rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px;
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
	transition: border-bottom 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
}

input[type="text"]:focus,
input[type="password"]:focus {
	outline: none;
	border-bottom: 4px solid var(--primary);
	box-shadow: 0 2px 5px rgba(37, 99, 235, 0.2);
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
