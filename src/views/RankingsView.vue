<script setup>
import {computed, onMounted, ref} from "vue"
import {useI18n} from "vue-i18n"
import {getLeaderboards} from "@/services/rankings.js"
import UiPageHeader from "@/components/ui/UiPageHeader.vue"
import UiTabs from "@/components/ui/UiTabs.vue"
import UiButton from "@/components/ui/UiButton.vue"
import UiStatePanel from "@/components/ui/UiStatePanel.vue"

const {locale, t} = useI18n()
const selectedServer = ref("main")
const serverOptions = [
	{ id: "main", labelKey: "rankingServers.main", hintKey: "rankingServers.mainHint" },
	{ id: "thulium", labelKey: "rankingServers.thulium", hintKey: "rankingServers.thuliumHint" },
]
const localizedServerTabs = computed(() =>
	serverOptions.map((option) => ({
		key: option.id,
		label: t(option.labelKey),
		description: t(option.hintKey),
	}))
)
const rankings = ref({place: [], destroy: [], playtime: []})
const generatedAt = ref(0)
const loading = ref(true)
const error = ref("")

const boards = computed(() => [
	{
		id: "destroy",
		title: t("rankingsPage.destroy"),
		description: t("rankingsPage.destroyDescription"),
		entries: rankings.value.destroy || [],
	},
	{
		id: "place",
		title: t("rankingsPage.place"),
		description: t("rankingsPage.placeDescription"),
		entries: rankings.value.place || [],
	},
	{
		id: "playtime",
		title: t("rankingsPage.playtime"),
		description: t("rankingsPage.playtimeDescription"),
		entries: rankings.value.playtime || [],
	},
])

const updatedText = computed(() => {
	if (!generatedAt.value) return t("rankingsPage.waiting")
	return new Date(generatedAt.value).toLocaleString(locale.value === "zh" ? "zh-CN" : "en-US")
})

function formatValue(boardId, value) {
	const amount = Math.max(0, Number(value) || 0)
	if (boardId !== "playtime") return Math.round(amount).toLocaleString()
	const minutes = Math.round(amount)
	const days = Math.floor(minutes / 1440)
	const hours = Math.floor((minutes % 1440) / 60)
	const rest = minutes % 60
	return [
		days ? t("rankingsPage.days", {count: days}) : "",
		hours ? t("rankingsPage.hours", {count: hours}) : "",
		t("rankingsPage.minutes", {count: rest}),
	]
		.filter(Boolean)
		.join(" ")
}

async function selectServer(serverId) {
	if (selectedServer.value === serverId && !error.value) return
	selectedServer.value = serverId
	await loadRankings()
}

async function loadRankings() {
	loading.value = true
	error.value = ""
	try {
		const result = await getLeaderboards(50, selectedServer.value)
		rankings.value = result.rankings || {place: [], destroy: [], playtime: []}
		generatedAt.value = Number(result.generatedAt || 0)
	} catch (cause) {
		error.value = cause.message || t("rankingsPage.loadFailed")
	} finally {
		loading.value = false
	}
}

onMounted(loadRankings)
</script>

<template>
	<div class="rankings-page page-shell">
		<UiPageHeader
			:title="t('rankingsPage.title')"
			:subtitle="t('rankingsPage.description')"
		>
			<UiTabs
				:model-value="selectedServer"
				variant="segmented"
				:items="localizedServerTabs"
				:aria-label="t('rankingServers.label')"
				:disabled="loading"
				@select="(item) => selectServer(item.key)"
			/>

			<template #actions>
				<div class="sync-box">
					<div class="sync-meta">
						<span>{{ t('rankingsPage.generatedAt') }}</span>
						<strong>{{ updatedText }}</strong>
					</div>
					<UiButton
						variant="tonal"
						icon="refresh"
						:loading="loading"
						:disabled="loading"
						@click="loadRankings"
					>
						{{ loading ? t('rankingsPage.syncing') : t('rankingsPage.refresh') }}
					</UiButton>
				</div>
			</template>
		</UiPageHeader>

		<UiStatePanel
			v-if="error"
			state="error"
			:title="error"
			:action-label="t('rankingsPage.refresh')"
			@action="loadRankings"
		/>
		<UiStatePanel
			v-else-if="loading && !boards.some(board => board.entries.length)"
			state="loading"
			:message="t('rankingsPage.loading')"
		/>

		<section v-else class="boards-grid">
			<article v-for="board in boards" :key="board.id" class="board-card">
				<header>
					<div>
						<h2>{{ board.title }}</h2>
						<p>{{ board.description }}</p>
					</div>
					<span>{{ board.entries.length }} / 50</span>
				</header>
				<ol v-if="board.entries.length" class="ranking-list">
					<li v-for="entry in board.entries" :key="entry.name" :class="`rank-${entry.rank}`">
						<span class="rank">{{ String(entry.rank).padStart(2, '0') }}</span>
						<strong>{{ entry.name }}</strong>
						<output>{{ formatValue(board.id, entry.value) }}</output>
					</li>
				</ol>
				<UiStatePanel
					v-else
					state="empty"
					icon="leaderboard"
					compact
					:message="t('rankingsPage.empty')"
				/>
			</article>
		</section>
	</div>
</template>

<style scoped>
.rankings-page {
	width: min(1340px, 100%);
	min-height: calc(100dvh - var(--app-header-height, 0px));
	margin-inline: auto;
	padding: clamp(1.25rem, 3.5vw, 2.5rem) clamp(1.25rem, 4vw, 3rem) 4rem;
	box-sizing: border-box;
	color: var(--text-main);
	display: grid;
	gap: 1.5rem;
	align-content: start;
}

.sync-box {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 0.75rem 1rem;
}

.sync-meta {
	display: grid;
	gap: 0.15rem;
	text-align: right;
}

.sync-meta span {
	color: var(--text-secondary);
	font-size: 0.78rem;
}

.sync-meta strong {
	font-size: 0.9rem;
}

.boards-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 1rem;
	align-items: start;
}

.board-card {
	border: 1px solid color-mix(in srgb, var(--text-main) 16%, transparent);
	background: var(--background);
	min-width: 0;
}

.board-card > header {
	display: flex;
	justify-content: space-between;
	gap: 1rem;
	padding: 1rem;
	border-bottom: 1px solid color-mix(in srgb, var(--text-main) 13%, transparent);
}

.board-card h2 {
	margin: 0;
	color: var(--title-color);
	font-size: 1.15rem;
}

.board-card header p {
	margin: 0.35rem 0 0;
	color: var(--text-secondary);
	font-size: 0.84rem;
}

.board-card header > span {
	color: var(--text-secondary);
	font: 700 0.78rem var(--font-mono, monospace);
	white-space: nowrap;
}

.ranking-list {
	list-style: none;
	padding: 0;
	margin: 0;
}

.ranking-list li {
	display: grid;
	grid-template-columns: 2.5rem minmax(0, 1fr) auto;
	align-items: center;
	gap: 0.6rem;
	min-height: 48px;
	padding: 0.55rem 0.9rem;
	border-bottom: 1px solid color-mix(in srgb, var(--text-main) 9%, transparent);
}

.ranking-list li:last-child {
	border-bottom: 0;
}

.ranking-list .rank {
	color: var(--text-secondary);
	font: 700 0.78rem var(--font-mono, monospace);
}

.ranking-list strong {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.ranking-list output {
	color: var(--text-secondary);
	font: 700 0.8rem var(--font-mono, monospace);
	text-align: right;
	font-variant-numeric: tabular-nums;
}

.ranking-list .rank-1 {
	background: color-mix(in srgb, #f7c948 13%, transparent);
}

.ranking-list .rank-2 {
	background: color-mix(in srgb, #94a3b8 11%, transparent);
}

.ranking-list .rank-3 {
	background: color-mix(in srgb, #c77c48 10%, transparent);
}

@media (max-width: 1050px) {
	.boards-grid {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 640px) {
	.rankings-page {
		padding: 1rem;
	}

	.sync-box {
		justify-content: flex-start;
	}

	.sync-meta {
		text-align: left;
	}

	.ranking-list li {
		grid-template-columns: 2rem minmax(0, 1fr);
	}

	.ranking-list output {
		grid-column: 2;
		text-align: left;
	}
}

/* Material Design 3 Rankings */
:global(:root[data-ui="modern"] .rankings-page) {
	background: var(--md-sys-color-surface);
}

:global(:root[data-ui="modern"] .rankings-page .sync-box) {
	padding: 0.55rem 0.75rem 0.55rem 1rem;
	background: var(--md-sys-color-surface-container-low);
	border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 45%, transparent);
	border-radius: var(--md-sys-shape-corner-extra-large);
}

:global(:root[data-ui="modern"] .rankings-page .board-card) {
	border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 45%, transparent);
	border-radius: var(--md-sys-shape-corner-extra-large);
	background: var(--md-sys-color-surface-container-low);
	box-shadow: var(--md-sys-elevation-level1);
	overflow: hidden;
}

:global(:root[data-ui="modern"] .rankings-page .board-card > header) {
	background: var(--md-sys-color-surface-container);
	border-bottom-color: color-mix(in srgb, var(--md-sys-color-outline-variant) 45%, transparent);
}
</style>
