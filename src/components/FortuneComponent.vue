<script setup>
import { computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import UiButton from '@/components/ui/UiButton.vue';
import UiStatePanel from '@/components/ui/UiStatePanel.vue';
import { useUiPreferences } from '@/composables/useUiPreferences.js';

const loginStat = ref(false);
const { t } = useI18n();
const { isModernUi } = useUiPreferences();
const hintMessage = ref("");
const fortuneData = ref(null);
const isLoading = ref(false);
const isCheckingLogin = ref(true);
const errorMessage = ref("");

const fortuneItems = computed(() => {
	if (!fortuneData.value) return [];
	return [
		{ key: 'love', label: t('fortunePage.love'), data: fortuneData.value.love },
		{ key: 'career', label: t('fortunePage.career'), data: fortuneData.value.career },
		{ key: 'wealth', label: t('fortunePage.wealth'), data: fortuneData.value.wealth },
	].filter((item) => item.data && typeof item.data === 'object');
});

onMounted(async () => {
  await validateToken();
  if (loginStat.value) {
    fetchFortune();
  }
});

async function validateToken() {
  isCheckingLogin.value = true;
  errorMessage.value = "";
  if (!localStorage.getItem("token")) {
    showLoginPrompt();
    isCheckingLogin.value = false;
    return false;
  }

  try {
    const response = await fetch("https://api.qoriginal.vip/qo/authorization/account", {
      headers: { "token": localStorage.getItem("token") }
    });
    const data = await response.json();

    if (data.error === 1 || data.error === 3) {
      showLoginPrompt();
      return false;
    }

    loginStat.value = true;
    return true;
  } catch (error) {
		errorMessage.value = t('accountPage.connectFailed');
    return false;
  } finally {
    isCheckingLogin.value = false;
  }
}

function showLoginPrompt() {
	 hintMessage.value = t('fortunePage.loginPrompt');
  loginStat.value = false;
}

async function fetchFortune() {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const payload = await fetch("https://api.qoriginal.vip/qo/authorization/fortune", {
      headers: { "token": localStorage.getItem("token") }
    }).then(response => response.json());
    if (!payload || !payload.love || !payload.career || !payload.wealth) {
      throw new Error("Invalid fortune payload");
    }
    fortuneData.value = payload;
  } catch (error) {
		errorMessage.value = t('fortunePage.loadFailed');
  } finally {
    isLoading.value = false;
  }
}

const getProgressColor = (amount) => {
  if (amount >= 80) return 'var(--success)';
  if (amount >= 50) return 'var(--warning)';
  return 'var(--error)';
};
</script>

<template>
	<section class="fortune-panel">
		<div class="fortune-toolbar">
			<div class="fortune-toolbar__copy">
				<h2>{{ t('fortunePage.title') }}</h2>
				<p>{{ t('fortunePage.description') }}</p>
			</div>
			<UiButton
				v-if="loginStat"
				variant="tonal"
				icon="refresh"
				:loading="isLoading"
				:disabled="isLoading"
				@click="fetchFortune"
			>
				{{ isLoading ? t('common.refreshing') : t('fortunePage.refresh') }}
			</UiButton>
		</div>

		<UiStatePanel
			v-if="isCheckingLogin"
			state="loading"
			:message="t('fortunePage.checkingLogin')"
		/>

		<UiStatePanel
			v-else-if="!loginStat"
			state="info"
			icon="lock"
			:title="t('fortunePage.needLogin')"
			:message="hintMessage"
			:action-label="t('fortunePage.loginNow')"
			action-to="/login"
		/>

		<UiStatePanel
			v-else-if="errorMessage"
			state="error"
			:title="errorMessage"
			:action-label="t('fortunePage.refresh')"
			@action="fetchFortune"
		/>

		<UiStatePanel
			v-else-if="isLoading"
			state="loading"
			:message="t('fortunePage.loading')"
		/>

		<div v-else-if="fortuneData" class="fortune-content">
			<article v-for="item in fortuneItems" :key="item.key" class="category-card">
				<div class="category-header">
					<div>
						<h3>{{ t('fortunePage.fortune', { label: item.label }) }}</h3>
						<span>{{ item.data.amount }}%</span>
					</div>
				</div>
				<md-linear-progress
					v-if="isModernUi"
					class="m3-fortune-progress"
					:value="Math.max(0, Math.min(1, Number(item.data.amount || 0) / 100))"
					:style="{ '--md-linear-progress-active-indicator-color': getProgressColor(item.data.amount) }"
					:aria-label="`${t('fortunePage.fortune', { label: item.label })}: ${item.data.amount}%`"
				/>
				<div v-else class="progress-bar">
					<div
						class="progress-fill"
						:style="{
							width: `${item.data.amount}%`,
							backgroundColor: getProgressColor(item.data.amount)
						}"
					></div>
				</div>
				<p class="comment">{{ item.data.comment }}</p>
			</article>
		</div>
	</section>
</template>

<style scoped>
.fortune-panel {
	--fortune-border: var(--border-soft, var(--split));
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
	width: 100%;
	color: var(--text-main);
}

.fortune-toolbar {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 0.75rem 1.25rem;
}

.fortune-toolbar__copy h2 {
	margin: 0;
	color: var(--title-color);
	font-size: clamp(1.2rem, 1.8vw, 1.5rem);
	line-height: 1.2;
}

.fortune-toolbar__copy p {
	margin: 0.3rem 0 0;
	color: var(--text-secondary);
	max-width: 65ch;
	line-height: 1.55;
}

.fortune-content {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 1rem;
}

.category-card {
	background: var(--background);
	border: 1px solid var(--fortune-border);
	padding: 1.1rem 1.2rem;
	min-width: 0;
}

.category-header {
	margin-bottom: 0.9rem;
}

.category-header > div {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 1rem;
}

.category-header h3 {
	margin: 0;
	color: var(--title-color);
	font-size: 1rem;
	line-height: 1.2;
}

.category-header span {
	color: var(--text-main);
	font-weight: 800;
	font-variant-numeric: tabular-nums;
}

.progress-bar {
	height: 10px;
	border: 1px solid var(--fortune-border);
	background: var(--background-secondary);
	overflow: hidden;
	margin: 0 0 0.9rem;
}

.progress-fill {
	height: 100%;
	transition:
		width 0.45s var(--ease-out),
		background-color 0.18s var(--ease-out);
}

.comment {
	color: var(--text-secondary);
	line-height: 1.6;
	margin: 0;
	padding-top: 0.85rem;
	border-top: 1px solid var(--fortune-border);
	overflow-wrap: anywhere;
}

@media (max-width: 980px) {
	.fortune-content {
		grid-template-columns: 1fr;
	}
}

.m3-fortune-progress {
	width: 100%;
	margin: 0 0 0.95rem;
	--md-linear-progress-track-height: 8px;
	--md-linear-progress-active-indicator-height: 8px;
	--md-linear-progress-track-shape: 999px;
}

:global(:root[data-ui="modern"] .fortune-panel .category-card) {
	border-radius: var(--md-sys-shape-corner-large);
	border-color: color-mix(in srgb, var(--md-sys-color-outline-variant) 45%, transparent);
	background: var(--md-sys-color-surface-container-low);
	box-shadow: var(--md-sys-elevation-level1);
}
</style>
