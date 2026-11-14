<script setup lang="ts">
import {computed, ref, onMounted} from "vue";
import { useI18n } from 'vue-i18n';
import UiButton from '@/components/ui/UiButton.vue';
import UiStatCard from '@/components/ui/UiStatCard.vue';
import UiStatGrid from '@/components/ui/UiStatGrid.vue';
import UiStatePanel from '@/components/ui/UiStatePanel.vue';

interface AffiliatedAccount {
	name: string;
	host: string;
}

const accounts = ref<AffiliatedAccount[]>([]);

const getAuthToken = () => localStorage.getItem("token") || "";
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
					"token": getAuthToken(),
					"Content-Type": "application/json"
				}
			}
		);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const data = await response.json();
		if (!Array.isArray(data)) {
			throw new Error(data?.reason || data?.message || "Invalid affiliated account payload");
		}
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
					"token": getAuthToken(),
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
				headers: { "token": getAuthToken() }
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
				<h2 class="headline">{{ t('affiliatedPage.title') }}</h2>
				<p class="subhead">{{ t('affiliatedPage.description') }}</p>
			</div>
			<div class="header-meter" :aria-label="t('affiliatedPage.capacity')">
				<span>{{ accounts.length }}/{{ accountLimit }}</span>
				<div class="meter-track">
					<div class="meter-fill" :style="{ width: `${Math.min(accounts.length / accountLimit, 1) * 100}%` }"></div>
				</div>
			</div>
		</header>

		<UiStatGrid :columns="3" class="affiliated-summary-grid">
			<UiStatCard
				:label="t('affiliatedPage.registered')"
				:value="accounts.length"
				icon="group"
			/>
			<UiStatCard
				:label="t('affiliatedPage.remaining')"
				:value="accountSlots"
				icon="person_add"
				tone="primary"
			/>
			<UiStatCard
				:label="t('affiliatedPage.management')"
				:value="t('affiliatedPage.readOnlyDeletable')"
				icon="admin_panel_settings"
			/>
		</UiStatGrid>

		<div class="grid">
			<section class="panel">
				<div class="section-head">
					<div>
						<div class="section-title">{{ t('affiliatedPage.registeredAccounts') }}</div>
						<p class="section-sub">{{ t('affiliatedPage.registeredDescription') }}</p>
					</div>
					<UiButton
						type="button"
						variant="tonal"
						size="sm"
						icon="refresh"
						class="ghost-button"
						:loading="isLoading"
						:disabled="isLoading"
						@click="fetchAccounts"
					>
						{{ isLoading ? t('common.refreshing') : t('common.refresh') }}
					</UiButton>
				</div>

				<UiStatePanel v-if="isLoading" state="loading" :message="t('affiliatedPage.loading')" />
				<UiStatePanel v-else-if="loadError" state="error" compact role="alert" :message="loadError" />
				<TransitionGroup v-else-if="accounts.length" name="account-list" tag="div" class="account-grid">
					<div v-for="account in accounts" :key="account.name" class="account-card" :class="{ 'is-confirming': pendingDelete === account.name }">
						<div class="avatar">{{ initialOf(account.name) }}</div>
						<div class="account-copy">
							<h3 class="account-name">{{ account.name }}</h3>
							<p class="account-meta">{{ t('affiliatedPage.mainAccount', { host: account.host || t('affiliatedPage.unbound') }) }}</p>
						</div>
						<div class="account-actions">
							<span class="account-status">{{ t('affiliatedPage.readOnly') }}</span>
							<UiButton
								type="button"
								variant="outlined"
								size="sm"
								icon="delete"
								class="icon-button"
								:disabled="deletingAccount !== ''"
								:aria-label="t('affiliatedPage.deleteAccount', { name: account.name })"
								:title="t('affiliatedPage.deleteTitle', { name: account.name })"
								@click="requestDelete(account.name)"
							/>
						</div>
						<div v-if="pendingDelete === account.name" class="delete-confirm">
							<p>{{ t('affiliatedPage.deleteConfirm') }}</p>
							<div>
								<UiButton type="button" variant="text" size="sm" :disabled="deletingAccount !== ''" @click="cancelDelete">
									{{ t('common.cancel') }}
								</UiButton>
								<UiButton
									type="button"
									variant="danger"
									size="sm"
									:loading="deletingAccount === account.name"
									:disabled="deletingAccount !== ''"
									@click="deleteAccount(account.name)"
								>
									{{ deletingAccount === account.name ? t('common.deleting') : t('common.delete') }}
								</UiButton>
							</div>
						</div>
						<div v-else class="account-foot">
							<span>{{ t('affiliatedPage.passwordNotice') }}</span>
						</div>
					</div>
				</TransitionGroup>
				<UiStatePanel
					v-else
					state="empty"
					icon="manage_accounts"
					:title="t('affiliatedPage.noAccounts')"
					:message="t('affiliatedPage.noAccountsDescription')"
				/>
			</section>

			<section class="panel">
				<div class="section-head">
					<div>
						<div class="section-title">{{ t('affiliatedPage.newAccount') }}</div>
					</div>
				</div>
				<form class="new-account-form" @submit.prevent="createAccount">
					<label class="field">
						<span class="field-label">{{ t('affiliatedPage.username') }}</span>
						<input
							v-model="newAccountName"
							type="text"
							:placeholder="t('affiliatedPage.usernamePlaceholder')"
							class="text-input"
							autocomplete="username"
							autocorrect="off"
							autocapitalize="none"
							spellcheck="false"
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
						<UiButton
							type="submit"
							variant="filled"
							class="filled-button"
							:loading="isSubmitting"
							:disabled="!canSubmit"
						>
							{{ isSubmitting ? t('affiliatedPage.creating') : t('affiliatedPage.create') }}
						</UiButton>
						<span class="quota-text">{{ t('affiliatedPage.canCreate', { count: accountSlots }) }}</span>
					</div>

					<p class="supporting-text">
						{{ t('affiliatedPage.termsBefore') }}
						<a href="https://qoriginal.vip/guides/affiliatedaccount" class="link-text">{{ t('affiliatedPage.termsLink') }}</a>
					</p>

					<UiStatePanel
						v-if="currentHint !== ''"
						:state="hintType === 'success' ? 'info' : 'error'"
						compact
						:icon="hintType === 'success' ? 'check_circle' : 'error_outline'"
						role="status"
						:message="currentHint"
					/>
				</form>
			</section>
		</div>
	</div>
</template>

<style scoped src="./AffiliatedAccountComponent.css"></style>
<style scoped src="./AffiliatedAccountComponentForm.css"></style>
