<template>
	<div class="dashboard">
		<div v-if="isDialogVisible" class="dialog-overlay">
			<div class="dialog">
				<h2>注册成功！</h2>
				<p>欢迎加入 QOriginal！请在QQ群中发送确认信息来激活您的账户。</p>
				<button @click="closeDialog">确认</button>
			</div>
		</div>
		<div style="flex: 3; display: flex; flex-direction: column; align-items: center;">
			<h1>注册</h1>
			<span class="redirect" @click="redirect">
				<p class="arrow"><</p> <p>回到首页</p>
			</span>
		</div>
		<div style="flex: 6" class="fathercontainer">
			<h2>让我们开始吧</h2>
			<h3>您需要一个QQ和一个minecraft用户名来注册QOriginal账户。密码会被SHA加密并且存储在我们的数据库中。</h3>
			<form class="form" @submit.prevent="submitForm">
				<div class="input-group">
					<label for="username">Minecraft 用户名</label>
					<input type="text" id="username" v-model="username" required />
				</div>
				<div class="input-group">
					<label for="qq">QQ号</label>
					<input type="text" id="qq" v-model="qq" @input="validateQQ" required />
				</div>
				<div class="input-group">
					<label for="password">密码</label>
					<input type="password" id="password" v-model="password" required />
				</div>
				<p>{{ message }}</p>
				<button type="submit" :disabled="isLoading">
					<span v-if="isLoading" class="loading-spinner"></span>
					<span>{{ isLoading ? "正在请求..." : "注册" }}</span>
				</button>
			</form>
		</div>
	</div>
</template>

<style scoped>
.dashboard {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
	flex-direction: row;
	text-align: center;
	padding: 20px;
}

@media (max-width: 600px) {
	.dashboard {
		flex-direction: column;
		padding-bottom: 80px;
	}

	h1 {
		font-size: 2.5rem;
	}

	h2 {
		font-size: 1.25rem;
	}

	h3 {
		font-size: 1rem;
	}

	.form, form, .dialog {
		width: 90%;
		padding: 15px;
	}

	button[type="submit"] {
		width: 100%;
		padding: 15px;
		margin-bottom: 20px;
		font-size: 1rem;
	}

	h1 {
		margin: 10px;
	}
}

h1, p, h2, ul, li, h3 {
	color: var(--text);
}

h1 {
	font-size: 4rem;
	font-weight: 200;
}

h2 {
	font-size: 3.5rem;
	font-weight: 600;
}

h3 {
	font-weight: 500;
}

.redirect {
	display: flex;
	align-items: center;
	cursor: pointer;
	margin-top: 20px;
}

.arrow {
	margin-right: 8px;
	transition: margin-right 0.2s;
}

.redirect:hover .arrow {
	margin-right: 12px;
}

.form {
	display: flex;
	flex-direction: column;
	align-items: center; /* 居中表单中的内容 */
	margin-top: 20px;
	width: 100%;
}

button[type="submit"] {
	margin-top: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 15px 60px;
	border: none;
	border-radius: 20px;
	background-color: #354d69;
	color: #fff;
	font-size: 1.1rem;
	cursor: pointer;
	transition: background-color 0.3s ease;
}

button[type="submit"]:hover {
	background-color: #435e77;
}


.input-group {
	display: flex;
	align-items: center;
	margin-bottom: 15px;
	width: 100%;
}

.input-group label {
	font-weight: 600;
	font-size: 1rem;
	margin-right: 10px;
	color: var(--text);
	width: 130px;
}

input[type="text"],
input[type="password"] {
	flex: 1;
	margin: 10px 0;
	padding: 25px;
	background-color: rgba(112, 192, 252, 0.42);
	color: var(--text);
	border: none;
	border-bottom: #648fb9 5px solid;
	font-size: 1rem;
}

input:focus {
	border-bottom-color: #5fb493;
	background-color: #2c3d4d;
}

button[type="submit"] {
	margin-top: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 15px 60px;
	border: none;
	border-radius: 20px;
	background-color: #354d69;
	color: #fff;
	font-size: 1.1rem;
	cursor: pointer;
	transition: background-color 0.3s ease;
}

button[type="submit"]:hover {
	background-color: #435e77;
}

.dialog-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	justify-content: center;
	align-items: center;
}

.dialog {
	background-color: #3e4b77;
	padding: 20px 30px;
	border-radius: 30px;
	width: 90%;
	max-width: 500px;
	text-align: left;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
}

.dialog h2 {
	margin-bottom: 30px;
	font-size: 1.8rem;
}

.dialog p {
	margin-bottom: 50px;
	color: #aacde3;
}

.dialog button {
	align-self: flex-end;
	padding: 10px 30px;
	border: none;
	border-radius: 30px;
	background-color: #6491c5;
	color: #fff;
	font-size: 1rem;
	cursor: pointer;
	transition: background-color 0.3s ease;
}

.dialog button:hover {
	background-color: #8fc3f1;
}


.loading-spinner {
	border: 3px solid #fff;
	border-top: 3px solid transparent;
	border-radius: 50%;
	width: 1rem;
	height: 1rem;
	display: inline-block;
	animation: spin 1s linear infinite;
	margin-right: 5px;
}

@keyframes spin {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

.fathercontainer {
	background: #2c4438;
	padding: 20px 60px;
	margin-right: 10vw;
	border-radius: 20px;
	text-align: left;
}

</style>

<script setup >
import { useRouter } from "vue-router";
import { ref } from "vue";
import { get } from "/src/utils/request";

const router = useRouter();
const username = ref("");
const qq = ref("");
const password = ref("");
const isDialogVisible = ref(true);
const message = ref("");
const isLoading = ref(false);

function closeDialog() {
	isDialogVisible.value = false;
}

function submitForm() {
	isLoading.value = true;
	const url =
		"https://api.glowingstone.cn" +
		"/qo/upload/registry?name=" +
		username.value +
		"&password=" +
		password.value +
		"&uid=" +
		qq.value;
	get(url).then((result) => {
		if (result.result === true) {
			isDialogVisible.value = true;
		} else {
			message.value = "注册失败了！请检查qq或者用户名是否有重复。";
		}
		setTimeout(() => {}, 1000)
		isLoading.value = false;
	}).catch(() => {
		message.value = "请求失败，请稍后再试。";
		isLoading.value = false;
	});
}

function redirect() {
	router.push("/");
}

function validateQQ() {
	qq.value = qq.value.replace(/\D/g, "");
}

</script>
