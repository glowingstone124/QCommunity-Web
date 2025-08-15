<template>
	<div class="login-wrapper">
		<div class="login-panel">
			<h2 v-if="step === 1">输入您的 Minecraft 用户名</h2>
			<h2 v-if="step === 2">输入您的 QQ 号</h2>
			<h2 v-if="step === 3">设置您的密码</h2>

			<form @submit.prevent="handleNext">
				<input
					v-if="step === 1"
					type="text"
					placeholder="Minecraft 用户名"
					v-model="username"
					required
				/>
				<input
					v-if="step === 2"
					type="text"
					placeholder="QQ 号"
					v-model="qq"
					@input="validateQQ"
					required
				/>
				<input
					v-if="step === 3"
					type="password"
					placeholder="设置密码"
					v-model="password"
					required
				/>

				<p class="message">{{ message }}</p>

				<button type="submit" :disabled="isLoading">
					<span v-if="isLoading" class="spinner"></span>
					<span>{{ step === 3 ? "注册" : "下一步" }}</span>
				</button>
			</form>
		</div>

		<div v-if="isDialogVisible" class="dialog-overlay">
			<div class="dialog">
				<h2>注册成功！</h2>
				<p>欢迎加入 QOriginal！请在QQ群中发送确认信息来激活您的账户。</p>
				<button @click="closeDialog">确认</button>
			</div>
		</div>
	</div>
</template>


<script setup>
import {onBeforeUnmount, onMounted, ref} from "vue";
import { useRouter } from "vue-router";
import { get } from "/src/utils/request";
import {usePageStore} from "@/utils/store.ts";

const step = ref(1)
const username = ref("")
const qq = ref("")
const password = ref("")
const isDialogVisible = ref(false)
const message = ref("")
const isLoading = ref(false)
const router = useRouter()
const pageStore = usePageStore()

function validateQQ() {
	qq.value = qq.value.replace(/\D/g, "")
	return /^\d{5,12}$/.test(qq.value)
}


function validateUsername(username) {
	const url = `https://api.qoriginal.vip/qo/download/registry?name=${username.value}`
	fetch(url).then(res => res.json()).then((res) => {
		if (res.data.code !== 1) {
			return false
		}
	})
	return true
}

function handleNext() {
	message.value = ""

	if (step.value === 1) {
		if (!validateUsername(username.value)) {
			message.value = "用户名已被占用"
			return
		}
		step.value++
	} else if (step.value === 2) {
		if (!validateQQ()) {
			message.value = "请输入正确的 QQ 号"
			return
		}
		step.value++
	} else if (step.value === 3) {
		if (password.value.length < 4) {
			message.value = "密码长度不能少于 4 位"
			return
		}
		submitForm()
	}
}

function submitForm() {
	isLoading.value = true
	const url = `https://api.glowingstone.cn/qo/upload/registry?name=${username.value}&password=${password.value}&uid=${qq.value}`

	get(url)
		.then(result => {
			if (result.code === 0) {
				isDialogVisible.value = true
			} else {
				message.value = "注册失败，请检查信息是否已被使用"
			}
		})
		.catch(() => {
			message.value = "请求失败，请稍后再试"
		})
		.finally(() => {
			isLoading.value = false
		})
}

function closeDialog() {
	isDialogVisible.value = false
	router.push("/")
}

</script>

<style scoped>
.login-wrapper {
	height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
}

.login-panel {
	background: white;
	padding: 3rem;
	border-radius: 20px;
	width: 100%;
	max-width: 400px;
	box-shadow: 0 10px 30px rgba(0,0,0,0.2);
	text-align: center;
}

input {
	padding: 1rem;
	margin: 0.3rem 0;
	border: 2px solid #ccc;
	border-radius: 10px;
	font-size: 1rem;
}

button {
	width: 100%;
	padding: 1rem;
	background: #64816c;
	color: white;
	border: none;
	border-radius: 10px;
	font-size: 1.1rem;
	cursor: pointer;
}

.message {
	color: #ff4757;
	font-size: 0.9rem;
	min-height: 1rem;
}

.spinner {
	border: 3px solid white;
	border-top: 3px solid transparent;
	border-radius: 50%;
	width: 1rem;
	height: 1rem;
	display: inline-block;
	animation: spin 1s linear infinite;
	margin-right: 5px;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.dialog-overlay {
	position: fixed;
	top: 0; left: 0;
	width: 100vw; height: 100vh;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
}

.dialog {
	background: white;
	padding: 2rem;
	border-radius: 20px;
	max-width: 500px;
}

</style>
