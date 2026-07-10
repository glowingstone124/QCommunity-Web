<script setup lang="ts">
import {computed, ref, onMounted} from "vue";

interface AffiliatedAccount {
	name: string;
	host: string;
}

const accounts = ref<AffiliatedAccount[]>([]);

const token = localStorage.getItem("token");
const newAccountName = ref("");
const newAccountPassword = ref("");
const currentHint = ref("");
const isLoading = ref(true);
const isSubmitting = ref(false);
const deletingAccount = ref("");
const pendingDelete = ref("");
const loadError = ref("");

const accountLimit = 3;
const canSubmit = computed(() => {
	return newAccountName.value.trim() !== "" && newAccountPassword.value.trim() !== "" && !isSubmitting.value;
});

const accountSlots = computed(() => Math.max(accountLimit - accounts.value.length, 0));

function initialOf(name: string) {
	return name.trim().slice(0, 1).toUpperCase() || "?";
}

const fetchAccounts = async () => {
	isLoading.value = true;
	loadError.value = "";
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
		loadError.value = "附属账户列表加载失败，请稍后重试。";
	} finally {
		isLoading.value = false;
	}
};

const createAccount = async () => {
	if (!canSubmit.value) {
		currentHint.value = "请填写完整信息。";
		return;
	}
	isSubmitting.value = true;
	currentHint.value = "";
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
					"name": newAccountName.value.trim(),
					"password": newAccountPassword.value
				})
			}
		);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const result = await response.json();
		if (result.result === true) {
			currentHint.value = "附属账户已创建。";
			newAccountName.value = "";
			newAccountPassword.value = "";
			await fetchAccounts();
		} else {
			currentHint.value = "创建失败：请检查是否重名，或是否已经达到数量上限。";
		}
	} catch (err) {
		console.error("创建附属账户失败:", err);
		currentHint.value = "创建失败：服务器暂时无法处理请求。";
	} finally {
		isSubmitting.value = false;
	}
};

const requestDelete = (name: string) => {
	pendingDelete.value = name;
	currentHint.value = "";
};

const cancelDelete = () => {
	pendingDelete.value = "";
};

const deleteAccount = async (name: string) => {
	if (deletingAccount.value !== "") return;
	deletingAccount.value = name;
	currentHint.value = "";
	try {
		const response = await fetch(
			`https://api.qoriginal.vip/qo/authorization/affiliated/remove?name=${encodeURIComponent(name)}`,
			{
				method: "DELETE",
				headers: { "token": token || "" }
			}
		);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const result = await response.json();
		if (result.result === true) {
			currentHint.value = `附属账户 ${name} 已删除。`;
			pendingDelete.value = "";
			await fetchAccounts();
		} else {
			currentHint.value = "删除失败：账户不存在或不属于当前主账号。";
		}
	} catch (err) {
		console.error("删除附属账户失败:", err);
		currentHint.value = "删除失败：服务器暂时无法处理请求。";
	} finally {
		deletingAccount.value = "";
	}
};
onMounted(fetchAccounts);
</script>

<template>
	<div class="affiliated">
		<header class="page-header">
			<div>
				<h1 class="headline">附属账户</h1>
				<p class="subhead">创建和移除绑定账户。账号信息创建后不可修改。</p>
			</div>
			<div class="header-meter" aria-label="附属账户容量">
				<span>{{ accounts.length }}/{{ accountLimit }}</span>
				<div class="meter-track">
					<div class="meter-fill" :style="{ width: `${Math.min(accounts.length / accountLimit, 1) * 100}%` }"></div>
				</div>
			</div>
		</header>

		<div class="summary-grid">
			<div class="summary-item">
				<span>已注册</span>
				<strong>{{ accounts.length }}</strong>
			</div>
			<div class="summary-item">
				<span>剩余额度</span>
				<strong>{{ accountSlots }}</strong>
			</div>
			<div class="summary-item">
				<span>管理方式</span>
				<strong>只读 · 可删除</strong>
			</div>
		</div>

		<div class="grid">
			<section class="panel">
				<div class="section-head">
					<div>
						<div class="section-title">已注册的账户</div>
						<p class="section-sub">这些账户可使用主账号授权的访问能力。</p>
					</div>
					<button type="button" class="ghost-button" @click="fetchAccounts" :disabled="isLoading">
						{{ isLoading ? "刷新中" : "刷新" }}
					</button>
				</div>

				<div v-if="isLoading" class="state-box">正在加载附属账户...</div>
				<p v-else-if="loadError" class="state-box error">{{ loadError }}</p>
				<TransitionGroup v-else-if="accounts.length" name="account-list" tag="div" class="account-grid">
					<div v-for="account in accounts" :key="account.name" class="account-card" :class="{ 'is-confirming': pendingDelete === account.name }">
						<div class="avatar">{{ initialOf(account.name) }}</div>
						<div class="account-copy">
							<h3 class="account-name">{{ account.name }}</h3>
							<p class="account-meta">主账号 · {{ account.host || "未绑定" }}</p>
						</div>
						<div class="account-actions">
							<span class="account-status">只读</span>
							<button
								type="button"
								class="icon-button"
								:disabled="deletingAccount !== ''"
								:aria-label="`删除附属账户 ${account.name}`"
								:title="`删除 ${account.name}`"
								@click="requestDelete(account.name)"
							>
								<font-awesome-icon :icon="['far', 'trash-can']" aria-hidden="true" />
							</button>
						</div>
						<div v-if="pendingDelete === account.name" class="delete-confirm">
							<p>确定删除该账户？删除后无法恢复。</p>
							<div>
								<button type="button" class="confirm-cancel" :disabled="deletingAccount !== ''" @click="cancelDelete">取消</button>
								<button type="button" class="confirm-delete" :disabled="deletingAccount !== ''" @click="deleteAccount(account.name)">
									{{ deletingAccount === account.name ? "删除中" : "确认删除" }}
								</button>
							</div>
						</div>
						<div v-else class="account-foot">
							<span>密码仅可在创建时设置</span>
						</div>
					</div>
				</TransitionGroup>
				<div v-else class="state-box">
					<strong>暂无附属账户</strong>
					<span>创建后会显示在这里，用于快速识别和管理。</span>
				</div>
			</section>

			<section class="panel">
				<div class="section-head">
					<div>
						<div class="section-title">注册新的附属账户</div>
					</div>
				</div>
				<div class="new-account-form">
					<label class="field">
						<span class="field-label">用户名</span>
						<input
							v-model="newAccountName"
							type="text"
							placeholder="输入用户名"
							class="text-input"
							autocomplete="username"
						/>
					</label>
					<label class="field">
						<span class="field-label">密码</span>
						<input
							v-model="newAccountPassword"
							type="password"
							placeholder="设置登录密码"
							class="text-input"
							autocomplete="new-password"
						/>
					</label>

					<div class="form-actions">
						<button type="button" @click="createAccount" class="filled-button" :disabled="!canSubmit">
							{{ isSubmitting ? "创建中" : "创建账户" }}
						</button>
						<span class="quota-text">还可创建 {{ accountSlots }} 个</span>
					</div>

					<p class="supporting-text">
						使用该功能则证明您阅读并且认可
						<a href="https://qoriginal.vip/guides/affiliatedaccount" class="link-text">使用须知</a>
					</p>

					<p
						v-if="currentHint !== ''"
						:class="['inline-hint', currentHint.includes('已创建') || currentHint.includes('已删除') ? 'hint-success' : 'hint-error']"
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
	gap: 1rem;
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
	padding-bottom: 1rem;
	border-bottom: 1px solid var(--border-soft);
	animation: affiliated-block-in 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
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

.header-meter {
	width: 150px;
	display: grid;
	gap: 0.45rem;
	color: var(--text-secondary);
	font-size: 0.86rem;
	text-align: right;
}

.header-meter span {
	color: var(--text-main);
	font-weight: 700;
}

.meter-track {
	height: 6px;
	border: 1px solid var(--border-soft);
	background: var(--surface-soft);
}

.meter-fill {
	height: 100%;
	background: var(--primary);
	transition: width 0.2s ease;
}

.summary-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	border: 1px solid var(--border-soft);
	opacity: 0;
	animation: affiliated-block-in 420ms cubic-bezier(0.22, 1, 0.36, 1) 70ms forwards;
}

.summary-item {
	display: grid;
	gap: 0.3rem;
	padding: 0.85rem 1rem;
	border-right: 1px solid var(--border-soft);
}

.summary-item:last-child {
	border-right: none;
}

.summary-item span {
	color: var(--text-secondary);
	font-size: 0.86rem;
}

.summary-item strong {
	color: var(--text-main);
	font-size: 1.15rem;
	line-height: 1.2;
}

.grid {
	display: grid;
	grid-template-columns: minmax(360px, 1fr) minmax(320px, 400px);
	gap: 1rem;
	align-items: stretch;
	min-height: 0;
}

.panel {
	background: transparent;
	border-radius: 0;
	padding: 1rem;
	border: 1px solid var(--border-soft);
	display: flex;
	flex-direction: column;
	gap: 1rem;
	min-width: 0;
	opacity: 0;
	animation: affiliated-block-in 460ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.grid .panel:nth-child(1) { animation-delay: 130ms; }
.grid .panel:nth-child(2) { animation-delay: 190ms; }

.section-head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
	padding-bottom: 0.85rem;
	border-bottom: 1px solid var(--border-soft);
}

.section-title {
	font-size: 1rem;
	font-weight: 600;
	color: var(--title-color);
}

.section-sub {
	margin: 0.28rem 0 0;
	color: var(--text-secondary);
	font-size: 0.88rem;
	line-height: 1.45;
}

.account-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	gap: 0.65rem;
}

.account-list-enter-active,
.account-list-leave-active {
	transition: opacity 220ms ease, transform 220ms ease;
}

.account-list-enter-from,
.account-list-leave-to {
	opacity: 0;
	transform: translateY(-8px);
}

.account-list-move {
	transition: transform 220ms ease;
}

.account-card {
	display: grid;
	grid-template-columns: 40px minmax(0, 1fr) auto;
	gap: 0.75rem;
	align-items: center;
	padding: 0.85rem;
	border-radius: 0;
	background: var(--surface-soft);
	border: 1px solid var(--border-soft);
	min-width: 0;
}

.account-card.is-confirming {
	border-color: color-mix(in srgb, var(--error) 45%, var(--border-soft));
}

.avatar {
	width: 40px;
	height: 40px;
	border-radius: 0;
	background: color-mix(in srgb, var(--primary) 10%, transparent);
	border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	color: var(--primary);
}

.account-copy {
	min-width: 0;
}

.account-name {
	font-size: 1.05rem;
	font-weight: 600;
	margin: 0;
	color: var(--text-main);
	overflow-wrap: anywhere;
}

.account-meta {
	margin: 0.2rem 0 0 0;
	font-size: 0.85rem;
	color: var(--text-secondary);
	overflow-wrap: anywhere;
}

.account-actions {
	display: flex;
	align-items: center;
	gap: 0.4rem;
}

.account-status {
	border: 1px solid var(--border-soft);
	color: var(--text-secondary);
	font-size: 0.78rem;
	font-weight: 700;
	padding: 0.18rem 0.48rem;
}

.icon-button {
	width: 34px;
	height: 34px;
	padding: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border: 1px solid var(--border-soft);
	background: transparent;
	color: var(--text-secondary);
	cursor: pointer;
}

.icon-button:hover:not(:disabled) {
	color: var(--error);
	border-color: var(--error);
	background: color-mix(in srgb, var(--error) 7%, transparent);
}

.icon-button:disabled { opacity: 0.45; cursor: not-allowed; }

.account-foot {
	grid-column: 1 / -1;
	padding-top: 0.7rem;
	border-top: 1px solid var(--border-soft);
	color: var(--text-secondary);
	font-size: 0.82rem;
}

.delete-confirm {
	grid-column: 1 / -1;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 0.75rem;
	padding-top: 0.7rem;
	border-top: 1px solid color-mix(in srgb, var(--error) 35%, var(--border-soft));
	animation: affiliated-confirm-in 180ms ease both;
}

.delete-confirm p {
	margin: 0;
	color: var(--error);
	font-size: 0.82rem;
	line-height: 1.4;
}

.delete-confirm > div { display: flex; gap: 0.45rem; flex: 0 0 auto; }
.confirm-cancel, .confirm-delete { min-height: 34px; padding: 0 0.7rem; border: 1px solid var(--border-soft); cursor: pointer; font-weight: 600; }
.confirm-cancel { background: transparent; color: var(--text-main); }
.confirm-delete { background: var(--error); border-color: var(--error); color: white; }
.confirm-cancel:disabled, .confirm-delete:disabled { opacity: 0.5; cursor: not-allowed; }

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
	border-radius: 0;
	border: 1px solid var(--border-soft);
	background-color: var(--glass-soft);
	color: var(--text-main);
	transition: border-color 0.18s ease;
	width: 100%;
	box-sizing: border-box;
}

.text-input::placeholder {
	color: var(--text-secondary);
}

.text-input:focus {
	outline: none;
	border-color: var(--primary);
}

.filled-button {
	padding: 0.78rem 1.25rem;
	border-radius: 0;
	background-color: var(--button-primary-bg);
	color: var(--button-primary-text);
	font-weight: 600;
	border: 1px solid var(--primary);
	cursor: pointer;
	transition: background-color 0.18s ease;
	width: fit-content;
}

.ghost-button {
	border: 1px solid var(--border-soft);
	background: transparent;
	color: var(--text-main);
	padding: 0.55rem 0.8rem;
	cursor: pointer;
	font-weight: 600;
	transition:
		border-color 0.18s ease,
		background-color 0.18s ease;
	white-space: nowrap;
}

.ghost-button:hover {
	border-color: var(--primary);
	background: var(--surface-soft);
}

.ghost-button:disabled {
	opacity: 0.55;
	cursor: not-allowed;
}

.form-actions {
	display: flex;
	align-items: center;
	gap: 0.85rem;
	flex-wrap: wrap;
}

.quota-text {
	color: var(--text-secondary);
	font-size: 0.88rem;
}

.filled-button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.filled-button:hover:not(:disabled) {
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

.inline-hint,
.state-box {
	border: 1px solid var(--border-soft);
	background: var(--surface-soft);
	padding: 0.82rem 0.9rem;
	color: var(--text-secondary);
	font-size: 0.9rem;
	line-height: 1.5;
	margin: 0;
}

.state-box {
	display: grid;
	gap: 0.25rem;
	min-height: 96px;
	align-content: center;
}

.state-box strong {
	color: var(--text-main);
}

.state-box.error {
	border-color: color-mix(in srgb, var(--error) 45%, var(--border-soft));
	color: var(--error);
}

.hint-success {
	color: var(--success);
	font-weight: 600;
	border-color: color-mix(in srgb, var(--success) 45%, var(--border-soft));
}

.hint-error {
	color: var(--error);
	font-weight: 600;
	border-color: color-mix(in srgb, var(--error) 45%, var(--border-soft));
}

.empty {
	margin: 0;
	color: var(--text-secondary);
}

@keyframes affiliated-block-in {
	from { opacity: 0; transform: translateY(12px); }
	to { opacity: 1; transform: translateY(0); }
}

@keyframes affiliated-confirm-in {
	from { opacity: 0; transform: translateY(-5px); }
	to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
	.affiliated {
		padding: 1rem;
	}

	.page-header {
		flex-direction: column;
		align-items: flex-start;
	}

	.header-meter {
		width: 100%;
		text-align: left;
	}

	.summary-grid {
		grid-template-columns: 1fr;
	}

	.summary-item {
		border-right: none;
		border-bottom: 1px solid var(--border-soft);
	}

	.summary-item:last-child {
		border-bottom: none;
	}

	.grid {
		grid-template-columns: 1fr;
	}

	.section-head {
		flex-direction: column;
	}

	.filled-button {
		width: 100%;
	}

	.form-actions {
		align-items: stretch;
	}
}

@media (max-width: 520px) {
	.affiliated { padding: 0.85rem; }
	.summary-item { grid-template-columns: minmax(0, 1fr) auto; align-items: center; }
	.summary-item strong { text-align: right; font-size: 1rem; overflow-wrap: anywhere; }
	.panel { padding: 0.85rem; }
	.account-grid { grid-template-columns: 1fr; }
	.account-card { grid-template-columns: 38px minmax(0, 1fr) auto; padding: 0.75rem; }
	.avatar { width: 38px; height: 38px; }
	.account-status { display: none; }
	.delete-confirm { align-items: stretch; flex-direction: column; }
	.delete-confirm > div { width: 100%; }
	.confirm-cancel, .confirm-delete { flex: 1; }
}

@media (prefers-reduced-motion: reduce) {
	.account-list-enter-active,
	.account-list-leave-active,
	.account-list-move {
		transition: none;
	}

	.page-header,
	.summary-grid,
	.panel,
	.delete-confirm {
		opacity: 1;
		animation: none;
		transform: none;
	}
}
</style>
