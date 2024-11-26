<script setup>
import { ref, onMounted } from 'vue';
import { get } from "@/utils/request.js";

const username = ref(localStorage.getItem('username') || "");
const password = ref('');
const loginstat = ref(false);
const playtime = ref(0);
onMounted(() => {
	if (username) {
		const url = `https://rock.glowingstone.cn/qo/download/registry?name=${username.value}`;
		get(url).then(result => {
			if (result.code === 0) {
				playtime.value = result.playtime;
				loginstat.value = true;
			}
		});
	}
});

function logout() {
	loginstat.value = false;
	localStorage.removeItem('username');
}

function login() {
	const url = `https://rock.glowingstone.cn/qo/game/login?username=${username.value}&password=${password.value}`;
	get(url).then(result => {
		if (result.result === true) {
			localStorage.setItem("username", username.value);
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
		<span v-if="loginstat" style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <a class="link">更改密码</a>
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
	color: var(--text);
	font-size: 3.5rem;
	margin-top: 0;
	margin-bottom: 0;
	font-weight: 100;
	font-family: 'Bahnschrift', sans-serif;
}

a {
	color: var(--text);
	border: 1px solid var(--text);
	text-decoration: none;
	border-radius: 15px;
	padding: 10px 15px;
}
h1, p {
	color: #89fff5;;
}

.link {
	text-decoration: none;
	background: #56b79f70;
	margin-top: 20px;
	box-shadow: rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px;
	padding: 30px 30px;
	border-radius: 30px;
	color: #89fff5;
}

.link:hover {
	background-color: rgba(97, 177, 229, 0.51) !important;
	cursor: pointer;
}

.personal {
	background-color: rgba(121, 178, 180, 0.5);
	padding: 30px 50px;
	border-radius: 30px;
	font-family: 'Bahnschrift', sans-serif;
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
	display: block;
	width: 100%;
	border: none;
	color: var(--text);
	border-bottom: 3px solid #46c9b5;
	padding: 2vh;
	font-size: 16px;
	margin-bottom: 10px;
	box-sizing: border-box;
	background-color: #5a626850 !important;
	transition: border-bottom 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
}

input[type="text"]:focus,
input[type="password"]:focus {
	outline: none;
	border-bottom: 4px solid #99f6ee;
	box-shadow: 0 2px 5px rgba(47, 91, 136, 0.2);
}
input[type="text"]::placeholder,
input[type="password"]::placeholder {
	color: #a2d2c9;
	opacity: 1;
}
button {
	width: 100%;
	padding: 20px;
	margin-top: 20px;
	background-color: #5dbabd;
	color: white;
	border: none;
	border-radius: 40px;
	cursor: pointer;
	font-size: 16px;
	transition: background-color 0.3s ease-in-out;
}

button:hover {
	background-color: #247d7a;
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
		margin:0;
		padding:0;
		max-width: 100%
	}
	button {
		max-width: 100%;
	}
}
</style>
