<script setup lang="ts">
import { computed, onMounted, ref, Ref } from "vue";
import { useI18n } from "vue-i18n";
import AdvancementCard from "@/components/AdvancementComponent.vue";
import UiPageHeader from "@/components/ui/UiPageHeader.vue";
import UiStatGrid from "@/components/ui/UiStatGrid.vue";
import UiStatCard from "@/components/ui/UiStatCard.vue";
import UiSearchField from "@/components/ui/UiSearchField.vue";
import UiTabs from "@/components/ui/UiTabs.vue";
import UiStatePanel from "@/components/ui/UiStatePanel.vue";
import UiButton from "@/components/ui/UiButton.vue";

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
const statusFilter = ref<"all" | "pending" | "completed">("all");

const normalizedSearch = computed(() => searchText.value.trim().toLowerCase());
const filteredPendingList = computed(() => filterAdvancements(pendingAdvancementList.value));
const filteredCompletedList = computed(() => filterAdvancements(completedAdvancementList.value));
const showPending = computed(() => statusFilter.value === "all" || statusFilter.value === "pending");
const showCompleted = computed(() => statusFilter.value === "all" || statusFilter.value === "completed");
const filterItems = computed(() => [
	{ key: "all", label: t("advancementPage.filterAll"), badge: filteredPendingList.value.length + filteredCompletedList.value.length },
	{ key: "pending", label: t("advancementPage.pending"), badge: filteredPendingList.value.length },
	{ key: "completed", label: t("advancementPage.completed"), badge: filteredCompletedList.value.length },
]);

function toggleStatusFilter(next: "pending" | "completed") {
	statusFilter.value = statusFilter.value === next ? "all" : next;
}

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
		const completedRaw = await completedResponse.json();
		const completedData: Advancement[] = Array.isArray(completedRaw) ? completedRaw : [];
		completedAdvancementList.value = completedData;

		const allResponse = await fetch("https://api.qoriginal.vip/qo/advancement/all");
		if (!allResponse.ok)
			throw new Error(`请求 /all失败: ${allResponse.status}`);
		const allRaw = await allResponse.json();
		const allData: Advancement[] = Array.isArray(allRaw) ? allRaw : [];
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
	<div class="advancement-page page-shell">
		<UiPageHeader
			:title="t('advancementPage.title')"
			:subtitle="loginstat && username ? t('advancementPage.currentAccount', { username }) : ''"
		>
			<template v-if="loginstat" #actions>
				<UiButton
					variant="tonal"
					icon="refresh"
					:loading="isLoading"
					:disabled="isLoading"
					@click="fetchAdvancements"
				>
					{{ isLoading ? t('common.refreshing') : t('common.refresh') }}
				</UiButton>
			</template>
		</UiPageHeader>

		<UiStatePanel
			v-if="isCheckingLogin"
			state="loading"
			:message="t('advancementPage.checkingLogin')"
		/>

		<UiStatePanel
			v-else-if="!loginstat"
			state="info"
			icon="lock"
			:title="t('advancementPage.loginRequired')"
			:action-label="t('fortunePage.loginNow')"
			action-to="/login"
		/>

		<template v-else>
			<UiStatGrid :columns="3" :aria-label="t('advancementPage.overview')">
				<UiStatCard
					:label="t('advancementPage.completed')"
					:value="completedAdvancementList.length"
					icon="check_circle"
					tone="success"
					:interactive="true"
					:active="statusFilter === 'completed'"
					@click="toggleStatusFilter('completed')"
				/>
				<UiStatCard
					:label="t('advancementPage.pending')"
					:value="pendingAdvancementList.length"
					icon="schedule"
					:interactive="true"
					:active="statusFilter === 'pending'"
					@click="toggleStatusFilter('pending')"
				/>
				<UiStatCard
					:label="t('advancementPage.total')"
					:value="fullAdvancementList.length"
					icon="workspace_premium"
					tone="primary"
					:interactive="true"
					:active="statusFilter === 'all'"
					@click="statusFilter = 'all'"
				/>
			</UiStatGrid>

			<div class="toolbar">
				<UiSearchField
					v-model="searchText"
					:label="t('advancementPage.search')"
					:placeholder="t('advancementPage.searchPlaceholder')"
				/>
				<UiTabs
					v-model="statusFilter"
					variant="chips"
					:items="filterItems"
					:aria-label="t('advancementPage.filterLabel')"
				/>
			</div>

			<UiStatePanel
				v-if="loadError"
				state="error"
				:title="loadError"
				:action-label="t('common.refresh')"
				@action="fetchAdvancements"
			/>

			<UiStatePanel
				v-else-if="isLoading"
				state="loading"
				:message="t('advancementPage.loading')"
			/>

			<div
				v-else
				class="achievement-layout"
				:class="{ 'achievement-layout--single': statusFilter !== 'all' }"
			>
				<section v-if="showPending" class="achievement-section pending-section">
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
					<UiStatePanel
						v-else
						state="empty"
						icon="hourglass_empty"
						compact
						:message="normalizedSearch ? t('advancementPage.noMatches') : t('advancementPage.noPending')"
					/>
				</section>

				<section v-if="showCompleted" class="achievement-section completed-section">
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
					<UiStatePanel
						v-else
						state="empty"
						icon="verified"
						compact
						:message="normalizedSearch ? t('advancementPage.noMatches') : t('advancementPage.noCompleted')"
					/>
				</section>
			</div>
		</template>
	</div>
</template>

<style scoped src="./AdvancementView.css"></style>
