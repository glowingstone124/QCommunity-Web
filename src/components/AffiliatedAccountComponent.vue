<script setup lang="ts">
import {computed, ref, onMounted} from "vue";
import { useI18n } from 'vue-i18n';

interface AffiliatedAccount {
	name: string;
	host: string;
}

const accounts = ref<AffiliatedAccount[]>([]);

const token = localStorage.getItem("token");
const newAccountName = ref("");
const newAccountPassword = ref("");
const currentHint = ref("");
const hintType = ref("");
const { t } = useI18n();
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
		loadError.value = t('affiliatedPage.loadFailed');
	} finally {
		isLoading.value = false;
	}
};

const createAccount = async () => {
	if (!canSubmit.value) {
		currentHint.value = t('affiliatedPage.fillAll');
		hintType.value = 'error';
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
		currentHint.value = t('affiliatedPage.created');
			hintType.value = 'success';
			newAccountName.value = "";
			newAccountPassword.value = "";
			await fetchAccounts();
		} else {
			currentHint.value = t('affiliatedPage.createFailed');
			hintType.value = 'error';
		}
	} catch (err) {
		console.error("创建附属账户失败:", err);
		currentHint.value = t('affiliatedPage.createServerFailed');
		hintType.value = 'error';
	} finally {
		isSubmitting.value = false;
	}
};

const requestDelete = (name: string) => {
	pendingDelete.value = name;
	currentHint.value = "";
	hintType.value = "";
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
			currentHint.value = t('affiliatedPage.deleted', { name });
			hintType.value = 'success';
			pendingDelete.value = "";
			await fetchAccounts();
		} else {
			currentHint.value = t('affiliatedPage.deleteFailed');
			hintType.value = 'error';
		}
	} catch (err) {
		console.error("删除附属账户失败:", err);
		currentHint.value = t('affiliatedPage.deleteServerFailed');
		hintType.value = 'error';
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
				<h1 class="headline">{{ t('affiliatedPage.title') }}</h1>
				<p class="subhead">{{ t('affiliatedPage.description') }}</p>
			</div>
			<div class="header-meter" :aria-label="t('affiliatedPage.capacity')">
				<span>{{ accounts.length }}/{{ accountLimit }}</span>
				<div class="meter-track">
					<div class="meter-fill" :style="{ width: `${Math.min(accounts.length / accountLimit, 1) * 100}%` }"></div>
				</div>
			</div>
		</header>

		<div class="summary-grid">
			<div class="summary-item">
				<span>{{ t('affiliatedPage.registered') }}</span>
				<strong>{{ accounts.length }}</strong>
			</div>
			<div class="summary-item">
				<span>{{ t('affiliatedPage.remaining') }}</span>
				<strong>{{ accountSlots }}</strong>
			</div>
			<div class="summary-item">
				<span>{{ t('affiliatedPage.management') }}</span>
				<strong>{{ t('affiliatedPage.readOnlyDeletable') }}</strong>
			</div>
		</div>

		<div class="grid">
			<section class="panel">
				<div class="section-head">
					<div>
						<div class="section-title">{{ t('affiliatedPage.registeredAccounts') }}</div>
						<p class="section-sub">{{ t('affiliatedPage.registeredDescription') }}</p>
					</div>
					<button type="button" class="ghost-button" @click="fetchAccounts" :disabled="isLoading">

						{{ isLoading ? t('common.refreshing') : t('common.refresh') }}
					</button>
				</div>

				<div v-if="isLoading" class="state-box">{{ t('affiliatedPage.loading') }}</div>
				<p v-else-if="loadError" class="state-box error">{{ loadError }}</p>
				<TransitionGroup v-else-if="accounts.length" name="account-list" tag="div" class="account-grid">
					<div v-for="account in accounts" :key="account.name" class="account-card" :class="{ 'is-confirming': pendingDelete === account.name }">
						<div class="avatar">{{ initialOf(account.name) }}</div>
						<div class="account-copy">
							<h3 class="account-name">{{ account.name }}</h3>
							<p class="account-meta">{{ t('affiliatedPage.mainAccount', { host: account.host || t('affiliatedPage.unbound') }) }}</p>
						</div>
						<div class="account-actions">
							<span class="account-status">{{ t('affiliatedPage.readOnly') }}</span>
							<button
								type="button"
								class="icon-button"
								:disabled="deletingAccount !== ''"
								:aria-label="t('affiliatedPage.deleteAccount', { name: account.name })"
								:title="t('affiliatedPage.deleteTitle', { name: account.name })"
								@click="requestDelete(account.name)"
							>
								<font-awesome-icon :icon="['far', 'trash-can']" aria-hidden="true" />
							</button>
						</div>
						<div v-if="pendingDelete === account.name" class="delete-confirm">
							<p>{{ t('affiliatedPage.deleteConfirm') }}</p>
							<div>
								<button type="button" class="confirm-cancel" :disabled="deletingAccount !== ''" @click="cancelDelete">{{ t('common.cancel') }}</button>
								<button type="button" class="confirm-delete" :disabled="deletingAccount !== ''" @click="deleteAccount(account.name)">
									{{ deletingAccount === account.name ? t('common.deleting') : t('common.delete') }}
								</button>
							</div>
						</div>
						<div v-else class="account-foot">
							<span>{{ t('affiliatedPage.passwordNotice') }}</span>
						</div>
					</div>
				</TransitionGroup>
				<div v-else class="state-box">
					<strong>{{ t('affiliatedPage.noAccounts') }}</strong>
					<span>{{ t('affiliatedPage.noAccountsDescription') }}</span>
				</div>
			</section>

			<section class="panel">
				<div class="section-head">
					<div>
						<div class="section-title">{{ t('affiliatedPage.newAccount') }}</div>
					</div>
				</div>
				<div class="new-account-form">
					<label class="field">
						<span class="field-label">{{ t('affiliatedPage.username') }}</span>
						<input
							v-model="newAccountName"
							type="text"
							:placeholder="t('affiliatedPage.usernamePlaceholder')"
							class="text-input"
							autocomplete="username"
						/>
					</label>
					<label class="field">
						<span class="field-label">{{ t('affiliatedPage.password') }}</span>
						<input
							v-model="newAccountPassword"
							type="password"
							:placeholder="t('affiliatedPage.passwordPlaceholder')"
							class="text-input"
							autocomplete="new-password"
						/>
					</label>

					<div class="form-actions">
						<button type="button" @click="createAccount" class="filled-button" :disabled="!canSubmit">
							{{ isSubmitting ? t('affiliatedPage.creating') : t('affiliatedPage.create') }}
						</button>
						<span class="quota-text">{{ t('affiliatedPage.canCreate', { count: accountSlots }) }}</span>
					</div>

					<p class="supporting-text">
						{{ t('affiliatedPage.termsBefore') }}
						<a href="https://qoriginal.vip/guides/affiliatedaccount" class="link-text">{{ t('affiliatedPage.termsLink') }}</a>
					</p>

					<p
						v-if="currentHint !== ''"
						:class="['inline-hint', hintType === 'success' ? 'hint-success' : 'hint-error']"
					>
						{{ currentHint }}
					</p>
				</div>
			</section>
		</div>
	</div>
</template>

<style scoped src="./AffiliatedAccountComponent.css"></style>
<style scoped src="./AffiliatedAccountComponentForm.css"></style>
