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
	<div class="page-container">
		<h1 class="headline-large">附属账户</h1>

		<section class="section-container">
			<h2 class="title-large">已注册的账户 ({{ accounts.length }})</h2>

			<div class="account-container">
				<div v-for="account in accounts" :key="account.name" class="account-card">
					<h3 class="account-name">{{ account.name }}</h3>
				</div>
				<p v-if="accounts.length === 0" class="on-surface-variant">暂无附属账户。</p>
			</div>
		</section>

		<section class="section-container">
			<h2 class="title-large">注册新的附属账户</h2>

			<div class="new-account-form">
				<input v-model="newAccountName" type="text" placeholder="用户名" class="text-input" />
				<input v-model="newAccountPassword" type="password" placeholder="密码" class="text-input" />

				<button @click="createAccount" class="filled-button">
					创建账户
				</button>

				<p class="supporting-text">
					使用该功能则证明您阅读并且认可
					<a href="https://qoriginal.vip/docs#/affiliatedaccount" class="link-text">使用须知</a>
				</p>

				<p v-if="currentHint !== ''" :class="['supporting-text', 'hint']">
					{{ currentHint }}
				</p>
			</div>
		</section>
	</div>
</template>

<style scoped>
@import "@/assets/colors.css";
.page-container {
	max-width: 800px;
	margin: 20px;
	padding: 24px;
	color: var(--color-on-surface);
}
.headline-large {
	font-size: 3rem;
	font-weight: 400;
	color: var(--color-primary);
	margin-bottom: 24px;
}

.title-large {
	font-size: 1.5rem;
	font-weight: 500;
	color: var(--color-primary);
	margin-top: 24px;
	margin-bottom: 16px;
}

.supporting-text {
	font-size: 0.875rem;
	color: var(--color-on-surface-variant);
	line-height: 1.5;
}

.on-surface-variant {
	color: var(--color-on-surface-variant);
}
.section-container {
	padding-top: 10px;
}

.account-container {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-bottom: 20px;
}

.account-card {
	border-radius: 12px;
	background: var(--color-surface-container-high);
	padding: 1rem 1.5rem;
	width: fit-content;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
	transition: transform 0.2s;
}

.account-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.account-name {
	font-size: 1.125rem;
	font-weight: 600;
	color: var(--color-primary);
	margin: 0;
}

.new-account-form {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 100%;
	max-width: 350px;
}

.text-input {
	padding: 14px 16px;
	margin-bottom: 16px;
	border-radius: 8px;
	border: 1px solid var(--color-primary);
	background-color: var(--color-surface);
	color: var(--color-on-surface);
	transition: border-color 0.3s, box-shadow 0.3s;
}

.text-input::placeholder {
	color: var(--color-on-surface-variant);
}

.text-input:focus {
	outline: none;
	border-color: var(--color-primary);
}

.filled-button {
	padding: 12px 24px;
	border-radius: 20px;
	background-color: var(--color-primary);
	color: var(--color-on-primary);
	font-weight: 500;
	border: none;
	cursor: pointer;
	transition: background-color 0.3s, box-shadow 0.3s;
	text-transform: uppercase;
}
.filled-button:hover {
	background-color: var(--button-primary-hover);
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}

.filled-button:active {
	background-color: var(--primary-dark);
}
.link-text {
	color: var(--color-link);
	text-decoration: none;
	transition: color 0.2s;
}

.link-text:hover {
	color: var(--primary-light);
	text-decoration: underline;
}

.hint {
	color: var(--error);
	font-weight: 600;
}

@media (max-width: 768px) {
	.page-container {
		margin: 0;
		padding: 16px;
	}

	.account-container {
		justify-content: center;
	}

	.account-card {
		width: 100%;
	}

	.new-account-form {
		max-width: 100%;
	}
}
</style>
