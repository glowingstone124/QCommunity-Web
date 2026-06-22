<script setup lang="ts">
import { computed, onMounted, ref, Ref } from "vue";
import AdvancementCard from "@/components/AdvancementComponent.vue";

interface Advancement {
	id: number;
	name: string;
	description: string;
}

const fullAdvancementList: Ref<Advancement[]> = ref([]);
const completedAdvancementList: Ref<Advancement[]> = ref([]);
const pendingAdvancementList: Ref<Advancement[]> = ref([]);
const username = localStorage.getItem("username");
const loginstat = ref(false);
const isCheckingLogin = ref(true);
const isLoading = ref(false);
const loadError = ref("");
const searchText = ref("");

const normalizedSearch = computed(() => searchText.value.trim().toLowerCase());
const filteredPendingList = computed(() => filterAdvancements(pendingAdvancementList.value));
const filteredCompletedList = computed(() => filterAdvancements(completedAdvancementList.value));

function filterAdvancements(list: Advancement[]) {
	const keyword = normalizedSearch.value;
	if (!keyword) return list;
	return list.filter((adv) => {
		return `${adv.name} ${adv.description}`.toLowerCase().includes(keyword);
	});
}

const fetchAdvancements = async () => {
	isLoading.value = true;
	loadError.value = "";
	try {
		const completedResponse = await fetch(
			`https://api.qoriginal.vip/qo/advancement/completed?name=${username}`
		);
		if (!completedResponse.ok)
			throw new Error(`请求 /completed 失败: ${completedResponse.status}`);
		const completedData: Advancement[] = await completedResponse.json();
		completedAdvancementList.value = completedData;

		const allResponse = await fetch("https://api.qoriginal.vip/qo/advancement/all");
		if (!allResponse.ok)
			throw new Error(`请求 /all失败: ${allResponse.status}`);
		const allData: Advancement[] = await allResponse.json();
		fullAdvancementList.value = allData;

		const completedIdList = completedData.map((a) => a.id);
		pendingAdvancementList.value = allData.filter(
			(adv) => !completedIdList.includes(adv.id)
		);
	} catch (error) {
		console.error("加载成就失败:", error);
		loadError.value = "成就数据加载失败，请稍后重试。";
	} finally {
		isLoading.value = false;
	}
};

onMounted(async () => {
	const token = localStorage.getItem("token");
	try {
		const res = await fetch("https://api.qoriginal.vip/qo/authorization/account", {
			headers: { token }
		});
		const data = await res.json();
		loginstat.value = !(data.error === 1 || data.error === 3);
		if (loginstat.value) {
			await fetchAdvancements();
		}
	} catch (err) {
		loginstat.value = false;
		console.error("登录检查失败", err);
	} finally {
		isCheckingLogin.value = false;
	}
});
</script>

<template>
	<div class="advancement-page" v-if="loginstat">
		<header class="page-header">
			<div class="title-block">
				<h1>成就</h1>
				<p>当前账号：{{ username }}</p>
			</div>
			<button type="button" class="refresh-button" @click="fetchAdvancements" :disabled="isLoading">
				{{ isLoading ? "刷新中" : "刷新" }}
			</button>
		</header>

		<section class="summary-grid" aria-label="成就概览">
			<div class="summary-item">
				<span>已完成</span>
				<strong>{{ completedAdvancementList.length }}</strong>
			</div>
			<div class="summary-item">
				<span>未完成</span>
				<strong>{{ pendingAdvancementList.length }}</strong>
			</div>
			<div class="summary-item">
				<span>总计</span>
				<strong>{{ fullAdvancementList.length }}</strong>
			</div>
		</section>

		<div class="toolbar">
			<label class="search-field">
				<span>搜索成就</span>
				<input v-model="searchText" type="search" placeholder="输入名称或描述" />
			</label>
		</div>

		<p v-if="loadError" class="state-box error">{{ loadError }}</p>
		<div v-else-if="isLoading" class="state-box">正在加载成就数据...</div>

		<div v-else class="achievement-layout">
			<section class="achievement-section pending-section">
				<div class="section-head">
					<h2>未完成</h2>
					<span>{{ filteredPendingList.length }}</span>
				</div>
				<div v-if="filteredPendingList.length" class="card-grid">
					<AdvancementCard
						v-for="adv in filteredPendingList"
						:key="adv.id"
						:advancement="adv"
						status="pending"
					/>
				</div>
				<p v-else class="state-box">没有匹配的未完成成就。</p>
			</section>

			<section class="achievement-section completed-section">
				<div class="section-head">
					<h2>已完成</h2>
					<span>{{ filteredCompletedList.length }}</span>
				</div>
				<div v-if="filteredCompletedList.length" class="card-grid">
					<AdvancementCard
						v-for="adv in filteredCompletedList"
						:key="adv.id"
						:advancement="adv"
						status="completed"
					/>
				</div>
				<p v-else class="state-box">没有匹配的已完成成就。</p>
			</section>
		</div>
	</div>
	<div v-else class="hint-container">
		<div class="state-box">
			<h1>{{ isCheckingLogin ? "正在检查登录状态" : "使用此功能之前需要登录。" }}</h1>
		</div>
	</div>
</template>

<style scoped>
.advancement-page {
	--advancement-border: color-mix(in srgb, var(--text-main) 14%, transparent);
	--advancement-surface: var(--background);
	--advancement-soft: color-mix(in srgb, var(--text-main) 4%, transparent);
	--border-soft: var(--advancement-border);
	--glass-strong: var(--advancement-surface);
	--surface-soft: var(--advancement-soft);
	display: flex;
	flex-direction: column;
	gap: 1rem;
	height: 100%;
	min-height: 0;
	padding: 1rem;
	background: var(--background-secondary);
	color: var(--text-main);
	overflow: auto;
	box-sizing: border-box;
}

:global(:root[data-theme='dark'] .advancement-page) {
	--advancement-border: color-mix(in srgb, var(--dark-text-primary) 18%, transparent);
	--advancement-soft: color-mix(in srgb, var(--dark-text-primary) 7%, transparent);
}

.page-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid var(--advancement-border);
}

.title-block h1 {
	margin: 0;
	font-size: clamp(1.55rem, 2.2vw, 2.15rem);
	line-height: 1.15;
	color: var(--title-color);
}

.title-block p {
	margin: 0.35rem 0 0;
	color: var(--text-secondary);
	line-height: 1.5;
}

.refresh-button {
	border: 1px solid var(--advancement-border);
	background: var(--advancement-surface);
	color: var(--text-main);
	padding: 0.65rem 0.9rem;
	font-weight: 700;
	cursor: pointer;
	transition:
		border-color 0.18s ease,
		background-color 0.18s ease;
}

.refresh-button:hover:not(:disabled) {
	border-color: var(--primary);
	background: var(--advancement-soft);
}

.refresh-button:disabled {
	opacity: 0.55;
	cursor: not-allowed;
}

.summary-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	border: 1px solid var(--advancement-border);
	background: var(--advancement-surface);
}

.summary-item {
	display: grid;
	gap: 0.3rem;
	padding: 0.9rem 1rem;
	border-right: 1px solid var(--advancement-border);
	min-width: 0;
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
	font-size: clamp(1.15rem, 2vw, 1.45rem);
	line-height: 1.15;
}

.toolbar {
	display: grid;
	grid-template-columns: minmax(220px, 420px);
	align-items: end;
	gap: 1rem;
}

.search-field {
	display: grid;
	gap: 0.42rem;
}

.search-field span {
	color: var(--text-secondary);
	font-size: 0.86rem;
}

.search-field input {
	width: 100%;
	box-sizing: border-box;
	border: 1px solid var(--advancement-border);
	background: var(--advancement-surface);
	color: var(--text-main);
	padding: 0.72rem 0.85rem;
	font-size: 0.96rem;
	border-radius: 0;
}

.search-field input:focus {
	outline: none;
	border-color: var(--primary);
}

.achievement-layout {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 1rem;
	align-items: start;
	min-height: 0;
}

.achievement-section {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	min-width: 0;
}

.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	border: 1px solid var(--advancement-border);
	background: var(--advancement-surface);
	padding: 0.75rem 0.9rem;
}

.section-head h2 {
	margin: 0;
	font-size: 1.05rem;
	line-height: 1.2;
	color: var(--title-color);
}

.section-head span {
	color: var(--text-secondary);
	font-weight: 700;
}

.card-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
	gap: 0.65rem;
}

.state-box {
	border: 1px solid var(--advancement-border);
	background: var(--advancement-surface);
	padding: 1rem;
	color: var(--text-secondary);
	line-height: 1.5;
	margin: 0;
}

.state-box.error {
	border-color: color-mix(in srgb, var(--error) 48%, var(--advancement-border));
	color: var(--error);
}

.hint-container {
	min-height: calc(100dvh - var(--app-header-height, 0px));
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 1rem;
	background: var(--background-secondary);
	color: var(--text-main);
	box-sizing: border-box;
}

.hint-container .state-box {
	max-width: 520px;
	width: 100%;
}

.hint-container h1 {
	margin: 0;
	color: var(--title-color);
	font-size: 1.3rem;
	line-height: 1.3;
}

@media (max-width: 1180px) {
	.achievement-layout {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 820px) {
	.advancement-page {
		padding: 0.85rem;
	}

	.summary-grid {
		grid-template-columns: 1fr;
	}

	.summary-item {
		border-right: none;
		border-bottom: 1px solid var(--advancement-border);
	}

	.summary-item:last-child {
		border-bottom: none;
	}

	.toolbar {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 560px) {
	.page-header {
		flex-direction: column;
	}

	.refresh-button {
		width: 100%;
	}

	.section-head {
		padding: 0.7rem 0.8rem;
	}
}
</style>
