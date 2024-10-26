<template>
	<div class="login-container">
		<h2>登录</h2>
		<form @submit.prevent="login" autocomplete="off">
			<input type="text" v-model="username" placeholder="用户名" required />
			<input type="password" v-model="password" placeholder="密码" required />
			<div class="remember-me-checkbox">
				<label>
					<input type="checkbox" v-model="autologin" /> 记住我
				</label>
			</div>
			<button type="submit">登录</button>
		</form>
	</div>
</template>

<script setup>
import { ref } from "vue";
import { get, post } from "/src/utils/request.js";

const autologin = ref(false);
const username = ref("");
const password = ref("");

function login() {
	const url =
		"http://qoriginal.vip:8080" +
		"/qo/game/login?username=" +
		"glowingstone124" +
		"&password=" +
		"";

	get(url).then(result => {
		if (result.result === true) {
			if (autologin.value) {
				localStorage.setItem("autoLogin", true);
			}
			this.$router.push("");
		} else {
			alert("登录失败，请检查用户名和密码！");
		}
	}).catch(error => {
		console.error('登录请求发生错误:', error.message);
		alert("登录请求发生错误，请稍后再试。");
	});
}
</script>

<style scoped>
.login-container {
	width: 300px;
	margin: auto;
	padding: 20px;
	border: 1px solid #ccc;
	border-radius: 8px;
}

input[type="text"],
input[type="password"] {
	display: block;
	width: 100%;
	padding: 10px;
	margin-bottom: 10px;
	border: 1px solid #ccc;
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
	background-color: #2c3e50;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 16px;
}
</style>
