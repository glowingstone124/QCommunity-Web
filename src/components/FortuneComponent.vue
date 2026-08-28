<script setup>
import { computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const loginStat = ref(false);
const { t } = useI18n();
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
	];
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
    fortuneData.value = await fetch("https://api.qoriginal.vip/qo/authorization/fortune", {
      headers: { "token": localStorage.getItem("token") }
    }).then(response => response.json());
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
		<header class="fortune-header">
			<div>
				<h2>{{ t('fortunePage.title') }}</h2>
				<p>{{ t('fortunePage.description') }}</p>
			</div>
			<button
				v-if="loginStat"
				@click="fetchFortune"
				class="refresh-button"
				type="button"
				:disabled="isLoading"
			>
				{{ isLoading ? t('common.refreshing') : t('fortunePage.refresh') }}
			</button>
		</header>

		<div v-if="isCheckingLogin" class="state-box">{{ t('fortunePage.checkingLogin') }}</div>

		<div v-else-if="!loginStat" class="login-prompt">
			<div>
				<h3>{{ t('fortunePage.needLogin') }}</h3>
				<p>{{ hintMessage }}</p>
			</div>
			<router-link to="/login" class="login-button">{{ t('fortunePage.loginNow') }}</router-link>
		</div>

		<p v-else-if="errorMessage" class="state-box error">{{ errorMessage }}</p>

		<div v-else-if="isLoading" class="state-box">{{ t('fortunePage.loading') }}</div>

		<div v-else-if="fortuneData" class="fortune-content">
			<article v-for="item in fortuneItems" :key="item.key" class="category-card">
				<div class="category-header">
					<div>
						<h3>{{ t('fortunePage.fortune', { label: item.label }) }}</h3>
						<span>{{ item.data.amount }}%</span>
					</div>
				</div>
				<div class="progress-bar">
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
	gap: 1rem;
	max-width: 1180px;
	width: 100%;
	margin: 0 auto;
	color: var(--text-main);
}

.fortune-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
	border: 1px solid var(--fortune-border);
	background: var(--background);
	padding: 1rem;
}

.fortune-header h2 {
	margin: 0;
	color: var(--title-color);
	font-size: clamp(1.25rem, 1.8vw, 1.65rem);
	line-height: 1.2;
}

.fortune-header p {
	margin: 0.32rem 0 0;
	color: var(--text-secondary);
	line-height: 1.5;
}

.refresh-button,
.login-button {
	border: 1px solid var(--primary);
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
	padding: 0.72rem 1rem;
	font-weight: 700;
	cursor: pointer;
	text-decoration: none;
	white-space: nowrap;
	transition: background-color 0.18s ease;
}

.refresh-button:hover:not(:disabled),
.login-button:hover {
	background: var(--button-primary-hover);
}

.refresh-button:disabled {
	opacity: 0.55;
	cursor: not-allowed;
}

.state-box,
.login-prompt {
	border: 1px solid var(--fortune-border);
	background: var(--background);
	padding: 1rem;
	color: var(--text-secondary);
	line-height: 1.5;
}

.state-box {
	margin: 0;
}

.state-box.error {
	border-color: color-mix(in srgb, var(--error) 48%, var(--fortune-border));
	color: var(--error);
}

.login-prompt {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
}

.login-prompt h3 {
	margin: 0;
	color: var(--title-color);
	font-size: 1.05rem;
}

.login-prompt p {
	margin: 0.3rem 0 0;
	color: var(--text-secondary);
}

.fortune-content {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 1rem;
}

.category-card {
	background: var(--background);
	border: 1px solid var(--fortune-border);
	padding: 1rem;
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
		width 0.45s ease,
		background-color 0.18s ease;
}

.comment {
	color: var(--text-secondary);
	line-height: 1.55;
	margin: 0;
	padding-top: 0.8rem;
	border-top: 1px solid var(--fortune-border);
	overflow-wrap: anywhere;
}

@media (max-width: 980px) {
	.fortune-content {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 620px) {
	.fortune-header,
	.login-prompt {
		flex-direction: column;
	}

	.refresh-button,
	.login-button {
		width: 100%;
		text-align: center;
	}
}
</style>
