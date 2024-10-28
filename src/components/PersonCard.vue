<script setup>
import { ref, onMounted } from 'vue';
import { get } from "@/utils/request.js";

const username = ref(localStorage.getItem('username') || null);
const password = ref('');
const autologin = ref(false);
const playtime = ref(0);
const loginstat = ref(false);

onMounted(() => {
	if (username) {
		const url = `https://rock.glowingstone.cn/qo/download/registry?name=${username.value}`;
		get(url).then(result => {
			if (result.code === 0) {
				loginstat.value = true;
			}
		});
	}
});

function login() {
	const url = `https://rock.glowingstone.cn/qo/game/login?username=${username.value}&password=${password.value}`;

	get(url).then(result => {
		if (result.result === true) {
			if (autologin.value) {
				localStorage.setItem("username", username);
			}
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
		<h1 class="username">{{ loginstat ? username : "请先登录" }}</h1>
		<p v-if="loginstat">
			您已经游玩了<span style="font-size: 2rem">{{ playtime }}</span>分钟
		</p>
		<span v-if="loginstat" style="display: flex; flex-direction: column;">
            <a class="link">更改密码</a>
            <a class="link" @click="() => { loginstat = false; localStorage.removeItem('username'); }">退出登录</a>
        </span>
		<span v-else style="display: flex; flex-direction: column;">
			<form @submit.prevent="login" autocomplete="off" class="login-container">
				<input type="text" v-model="username" placeholder="用户名" required />
				<input type="password" v-model="password" placeholder="密码" required />
				<button type="submit">登录</button>
			</form>
		</span>
	</div>
</template>

<style scoped>
@import '/src/assets/main.css';

.username {
	color: var(--text);
	font-size: 2rem;
	margin-top: 0;
	margin-bottom: 0;
	font-weight: 300;
	font-family: 'Bahnschrift', sans-serif;
}
h1, p {
	color: var(--text);
}
.link {
	text-decoration: none;
	background: #5f6970;
	margin-top: 20px;
	box-shadow: rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px;
	padding: 30px 30px;
	border-radius: 30px;
	color: var(--text);
}
.link:hover {
	background-color: #354d69 !important;
	cursor: pointer;
}
.personal {
	background: #413b3b;
	width: 100%;
	margin: 0 80px;
	padding: 40px 50px;
	border-radius: 40px;
	font-family: 'Bahnschrift', sans-serif;
	* {transition: all 0.3s ease-in-out;}
}
.login-container {
	width: 300px;
	margin: auto;
	padding: 20px;
	border-radius: 8px;
}
input[type="text"],
input[type="password"] {
	display: block;
	width: 100%;
	background: inherit;
	border: none;
	color: var(--text);
	border-bottom: 2px solid #e4e9ef;
	padding: 10px;
	margin-bottom: 10px;
	border-radius: 4px;
	box-sizing: border-box;
}
.remember-me-checkbox label {
	font-size: 14px;
	display: inline-block;
}
button {
	width: 100%;
	padding: 10px;
	background-color: #2f5b88;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 16px;
}
</style>
