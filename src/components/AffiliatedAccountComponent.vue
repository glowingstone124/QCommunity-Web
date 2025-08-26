<script setup lang="ts">
import {ref, onMounted} from "vue";

interface AffiliatedAccount {
	name: string;
	host: string;
	password: string;
}

const accounts = ref<AffiliatedAccount[]>([]);

const token = localStorage.getItem("token");
const newAccountName = ref("");
const newAccountPassword = ref("");
const currentHint = ref("");
const fetchAccounts = async () => {
	try {
		const response = await fetch(
			"https://api.qoriginal.vip/qo/authorization/affiliated/query",
			{
				headers: {
					"token": token,
					"Content-Type": "application/json"
				}
			}
		);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const data: AffiliatedAccount[] = await response.json();
		accounts.value = data;
	} catch (err) {
		console.error("获取附属账户失败:", err);
	}
};

const createAccount = async () => {
	if (!newAccountName.value || !newAccountPassword.value) {
		alert("请填写完整信息");
		return;
	}
	try {
		const response = await fetch(
			"https://api.qoriginal.vip/qo/authorization/affiliated/add",
			{
				method: "POST",
				headers: {
					"token": token || "",
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					"name": newAccountName.value,
					"password": newAccountPassword.value
				})
			}
		);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const result = await response.json();
		if (result.result === true) {
			currentHint.value = "成功！";
		} else {
			currentHint.value = "错误：请检查是否有重复名字，以及现有账户是否大于三个。";
		}
		newAccountName.value = "";
		newAccountPassword.value = "";
		await fetchAccounts();
	} catch (err) {
		console.error("创建附属账户失败:", err);
	}
};
onMounted(fetchAccounts);
</script>

<template>
	<h1 class="title">附属账户</h1>
	<h2 class="title">已经注册的：</h2>
	<div class="account-container">
		<div v-for="account in accounts" :key="account.name" class="account">
			<h1>{{ account.name }}</h1>
		</div>
	</div>
	<h2 class="title">注册新的附属账户：</h2>
	<div class="new-account-form">
		<input v-model="newAccountName" type="text" placeholder="用户名" />
		<input v-model="newAccountPassword" type="password" placeholder="密码" />
		<button @click="createAccount">创建账户</button>
		<p>使用该功能则证明您阅读并且认可<a href="https://qoriginal.vip/docs#/affiliatedaccount">使用须知</a></p>
		<p class="hint" v-if="currentHint !== ''">{{ currentHint }}</p>
	</div>
</template>

<style scoped>
.new-account-form {
	display: flex;
	color: white;
	flex-direction: column;
	width: fit-content;
	a {
		color: white;
	}
}
.title {
	color: #d4e7a9;
}
.account-container {
	display: flex;
	flex-wrap: wrap;
}
.account {
	margin: 8px;
	width: fit-content;
	padding: 1rem 0.7rem;
	border-radius: 20px;
	background: rgba(44, 129, 74, 0.47);
}
.new-account-form {
	margin-top: 1rem;
	display: flex;
	gap: 0.5rem;
}

.new-account-form input {
	padding: 0.5rem;
	border-radius: 6px;
	border: 1px solid #ccc;
}

.new-account-form button {
	padding: 0.5rem 1rem;
	border-radius: 6px;
	background-color: #2c814a;
	color: #fff;
	border: none;
	cursor: pointer;
}

.new-account-form button:hover {
	background-color: #217039;
}
</style>
