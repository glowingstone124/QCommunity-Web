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
	<div class="affiliated">
		<header class="page-header">
			<div>
				<p class="eyebrow">Affiliated</p>
				<h1 class="headline">附属账户</h1>
				<p class="subhead">用于管理绑定账户与共享访问权限。</p>
			</div>
			<span class="pill">已注册 {{ accounts.length }} 个</span>
		</header>

		<div class="grid">
			<section class="panel">
				<div class="section-title">已注册的账户</div>
				<div class="account-grid" v-if="accounts.length">
					<div v-for="account in accounts" :key="account.name" class="account-card">
						<div class="avatar">{{ account.name.slice(0, 1) }}</div>
						<div>
							<h3 class="account-name">{{ account.name }}</h3>
							<p class="account-meta">可用于快速切换</p>
						</div>
					</div>
				</div>
				<p v-else class="empty">暂无附属账户。</p>
			</section>

			<section class="panel">
				<div class="section-title">注册新的附属账户</div>
				<div class="new-account-form">
					<label class="field">
						<span class="field-label">用户名</span>
						<input v-model="newAccountName" type="text" placeholder="输入用户名" class="text-input" />
					</label>
					<label class="field">
						<span class="field-label">密码</span>
						<input v-model="newAccountPassword" type="password" placeholder="设置登录密码" class="text-input" />
					</label>

					<button
						type="button"
						@click="createAccount"
						class="filled-button"
						:disabled="!newAccountName || !newAccountPassword"
					>
						创建账户
					</button>

					<p class="supporting-text">
						使用该功能则证明您阅读并且认可
						<a href="https://qoriginal.vip/docs#/affiliatedaccount" class="link-text">使用须知</a>
					</p>

					<p
						v-if="currentHint !== ''"
						:class="['supporting-text', currentHint.includes('成功') ? 'hint-success' : 'hint-error']"
					>
						{{ currentHint }}
					</p>
				</div>
			</section>
		</div>
	</div>
</template>

<style scoped>
@import "@/assets/colors.css";
.affiliated {
	display: flex;
	flex-direction: column;
	gap: 1.8rem;
	color: var(--color-on-surface);
	padding: 2rem 2.4rem;
}

.page-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;
}

.eyebrow {
	text-transform: uppercase;
	letter-spacing: 0.25rem;
	font-size: 0.75rem;
	color: var(--color-on-surface-variant);
	margin: 0 0 0.35rem 0;
}

.headline {
	font-size: 2.4rem;
	margin: 0 0 0.4rem 0;
	color: var(--color-primary);
}

.subhead {
	margin: 0;
	color: var(--color-on-surface-variant);
}

.pill {
	padding: 0.35rem 0.9rem;
	border-radius: 999px;
	background: rgba(37, 99, 235, 0.12);
	color: var(--color-on-surface);
	font-size: 0.9rem;
}

.grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
	gap: 1.5rem;
}

.panel {
	background: var(--glass-strong, rgba(255, 255, 255, 0.85));
	border-radius: 20px;
	padding: 1.6rem;
	border: 1px solid var(--border-soft, rgba(15, 23, 42, 0.08));
	box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
	display: flex;
	flex-direction: column;
	gap: 1.2rem;
}

.section-title {
	font-size: 1.1rem;
	font-weight: 600;
	color: var(--color-primary);
}

.account-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 0.8rem;
}

.account-card {
	display: flex;
	gap: 0.8rem;
	align-items: center;
	padding: 0.8rem 1rem;
	border-radius: 16px;
	background: var(--surface-soft, rgba(15, 23, 42, 0.05));
	border: 1px solid var(--border-soft, rgba(15, 23, 42, 0.08));
}

.avatar {
	width: 40px;
	height: 40px;
	border-radius: 12px;
	background: rgba(37, 99, 235, 0.2);
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	color: var(--color-primary);
}

.account-name {
	font-size: 1.05rem;
	font-weight: 600;
	margin: 0;
	color: var(--color-on-surface);
}

.account-meta {
	margin: 0.2rem 0 0 0;
	font-size: 0.85rem;
	color: var(--color-on-surface-variant);
}

.new-account-form {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.field {
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
}

.field-label {
	font-size: 0.9rem;
	color: var(--color-on-surface-variant);
}

.text-input {
	padding: 12px 14px;
	border-radius: 12px;
	border: 1px solid var(--border-soft, rgba(15, 23, 42, 0.12));
	background-color: var(--glass-soft, rgba(255, 255, 255, 0.9));
	color: var(--color-on-surface);
	transition: border-color 0.3s, box-shadow 0.3s;
}

.text-input::placeholder {
	color: var(--color-on-surface-variant);
}

.text-input:focus {
	outline: none;
	border-color: rgba(37, 99, 235, 0.6);
	box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.filled-button {
	padding: 12px 24px;
	border-radius: 16px;
	background-color: var(--color-primary);
	color: var(--color-on-primary);
	font-weight: 600;
	border: none;
	cursor: pointer;
	transition: background-color 0.3s, box-shadow 0.3s;
}

.filled-button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.filled-button:hover {
	background-color: var(--button-primary-hover);
	box-shadow: 0 6px 12px rgba(15, 23, 42, 0.2);
}

.supporting-text {
	font-size: 0.875rem;
	color: var(--color-on-surface-variant);
	line-height: 1.5;
	margin: 0;
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

.hint-success {
	color: var(--success);
	font-weight: 600;
}

.hint-error {
	color: var(--error);
	font-weight: 600;
}

.empty {
	margin: 0;
	color: var(--color-on-surface-variant);
}

@media (max-width: 768px) {
	.affiliated {
		padding: 1.2rem;
	}

	.page-header {
		flex-direction: column;
		align-items: flex-start;
	}
}
</style>
