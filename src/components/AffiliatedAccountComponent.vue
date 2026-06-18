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
.affiliated {
	display: flex;
	flex-direction: column;
	gap: 1.35rem;
	color: var(--text-main);
	padding: 1.4rem;
	min-height: 100%;
	background: var(--glass-strong);
	max-width: 1120px;
	width: 100%;
	margin: 0 auto;
	box-sizing: border-box;
}

.page-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;
}

.headline {
	font-size: 1.45rem;
	line-height: 1.2;
	margin: 0 0 0.4rem 0;
	color: var(--title-color);
}

.subhead {
	margin: 0;
	color: var(--text-secondary);
}

.pill {
	padding: 0.35rem 0.65rem;
	border-radius: 6px;
	background: var(--surface-soft);
	border: 1px solid var(--border-soft);
	color: var(--text-main);
	font-size: 0.86rem;
	white-space: nowrap;
}

.grid {
	display: grid;
	grid-template-columns: minmax(280px, 1fr) minmax(320px, 420px);
	gap: 0.85rem;
	align-items: start;
}

.panel {
	background: transparent;
	border-radius: 8px;
	padding: 1rem;
	border: 1px solid var(--border-soft);
	box-shadow: none;
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.section-title {
	font-size: 1rem;
	font-weight: 600;
	color: var(--title-color);
}

.account-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 0.55rem;
}

.account-card {
	display: flex;
	gap: 0.75rem;
	align-items: center;
	padding: 0.78rem 0.85rem;
	border-radius: 6px;
	background: var(--surface-soft);
	border: 1px solid var(--border-soft);
}

.avatar {
	width: 36px;
	height: 36px;
	border-radius: 6px;
	background: color-mix(in srgb, var(--primary) 10%, transparent);
	border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	color: var(--primary);
}

.account-name {
	font-size: 1.05rem;
	font-weight: 600;
	margin: 0;
	color: var(--text-main);
}

.account-meta {
	margin: 0.2rem 0 0 0;
	font-size: 0.85rem;
	color: var(--text-secondary);
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
	color: var(--text-secondary);
}

.text-input {
	padding: 0.78rem 0.9rem;
	border-radius: 6px;
	border: 1px solid var(--border-soft);
	background-color: var(--glass-soft);
	color: var(--text-main);
	transition:
		border-color 0.18s ease,
		box-shadow 0.18s ease;
}

.text-input::placeholder {
	color: var(--text-secondary);
}

.text-input:focus {
	outline: none;
	border-color: var(--primary);
	box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent);
}

.filled-button {
	padding: 0.78rem 1.25rem;
	border-radius: 6px;
	background-color: var(--button-primary-bg);
	color: var(--button-primary-text);
	font-weight: 600;
	border: 1px solid var(--primary);
	cursor: pointer;
	transition: background-color 0.18s ease;
	width: fit-content;
}

.filled-button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.filled-button:hover {
	background-color: var(--button-primary-hover);
}

.supporting-text {
	font-size: 0.875rem;
	color: var(--text-secondary);
	line-height: 1.5;
	margin: 0;
}

.link-text {
	color: var(--primary);
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
	color: var(--text-secondary);
}

@media (max-width: 768px) {
	.affiliated {
		padding: 1rem;
	}

	.page-header {
		flex-direction: column;
		align-items: flex-start;
	}

	.grid {
		grid-template-columns: 1fr;
	}

	.filled-button {
		width: 100%;
	}
}
</style>
