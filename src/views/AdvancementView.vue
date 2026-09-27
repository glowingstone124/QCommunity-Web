<script setup lang="ts">
import { computed, onMounted, ref, Ref } from "vue";
import { useI18n } from "vue-i18n";
import AdvancementCard from "@/components/AdvancementComponent.vue";

interface Advancement {
	id: number;
	name: string;
	description: string;
}

const fullAdvancementList: Ref<Advancement[]> = ref([]);
const { t } = useI18n();
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
		loadError.value = t("advancementPage.loadFailed");
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
				<h1>{{ t('advancementPage.title') }}</h1>
				<p>{{ t('advancementPage.currentAccount', { username }) }}</p>
			</div>
			<button type="button" class="refresh-button" @click="fetchAdvancements" :disabled="isLoading">
				{{ isLoading ? t('common.refreshing') : t('common.refresh') }}
			</button>
		</header>

		<section class="summary-grid" :aria-label="t('advancementPage.overview')">
			<div class="summary-item">
				<span>{{ t('advancementPage.completed') }}</span>
				<strong>{{ completedAdvancementList.length }}</strong>
			</div>
			<div class="summary-item">
				<span>{{ t('advancementPage.pending') }}</span>
				<strong>{{ pendingAdvancementList.length }}</strong>
			</div>
			<div class="summary-item">
				<span>{{ t('advancementPage.total') }}</span>
				<strong>{{ fullAdvancementList.length }}</strong>
			</div>
		</section>

		<div class="toolbar">
			<label class="search-field">
				<span>{{ t('advancementPage.search') }}</span>
				<input v-model="searchText" type="search" :placeholder="t('advancementPage.searchPlaceholder')" />
			</label>
		</div>

		<p v-if="loadError" class="state-box error">{{ loadError }}</p>
		<div v-else-if="isLoading" class="state-box">{{ t('advancementPage.loading') }}</div>

		<div v-else class="achievement-layout">
			<section class="achievement-section pending-section">
				<div class="section-head">
					<h2>{{ t('advancementPage.pending') }}</h2>
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
				<p v-else class="state-box">{{ t('advancementPage.noPending') }}</p>
			</section>

			<section class="achievement-section completed-section">
				<div class="section-head">
					<h2>{{ t('advancementPage.completed') }}</h2>
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
				<p v-else class="state-box">{{ t('advancementPage.noCompleted') }}</p>
			</section>
		</div>
	</div>
	<div v-else class="hint-container">
		<div class="state-box">
			<h1>{{ isCheckingLogin ? t('advancementPage.checkingLogin') : t('advancementPage.loginRequired') }}</h1>
		</div>
	</div>
</template>

<style scoped src="./AdvancementView.css"></style>
