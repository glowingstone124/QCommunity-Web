<script setup>
import {computed, onMounted, ref} from "vue"
import {useI18n} from "vue-i18n"
import {getLeaderboards} from "@/services/rankings.js"

const {locale, t} = useI18n()
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

async function loadRankings() {
	loading.value = true
	error.value = ""
	try {
		const result = await getLeaderboards(50)
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
	<main class="rankings-page page-shell">
		<header class="rankings-hero">
			<div>
				<h1>{{ t('rankingsPage.title') }}</h1>
				<p>{{ t('rankingsPage.description') }}</p>
			</div>
			<div class="sync-box">
				<span>{{ t('rankingsPage.generatedAt') }}</span>
				<strong>{{ updatedText }}</strong>
				<button type="button" :disabled="loading" @click="loadRankings">
					{{ loading ? t('rankingsPage.syncing') : t('rankingsPage.refresh') }}
				</button>
			</div>
		</header>

		<p v-if="error" class="error-state" role="alert">{{ error }}</p>
		<div v-if="loading && !boards.some(board => board.entries.length)" class="loading-state" role="status">
			{{ t('rankingsPage.loading') }}
		</div>

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
				<p v-else class="empty-state">{{ t('rankingsPage.empty') }}</p>
			</article>
		</section>
	</main>
</template>

<style scoped>
.rankings-page {
	min-height: calc(100dvh - var(--app-header-height, 0px));
	padding: clamp(1rem, 4vw, 3.5rem);
	box-sizing: border-box;
	color: var(--text-main);
}

.rankings-hero {
	display: flex;
	justify-content: space-between;
	align-items: end;
	gap: 2rem;
	padding-bottom: 1.5rem;
	border-bottom: 1px solid color-mix(in srgb, var(--text-main) 16%, transparent);
}

.rankings-hero h1 { margin: 0; color: var(--title-color); font-size: clamp(2rem, 5vw, 4.4rem); font-weight: 420; }
.rankings-hero p { margin: .75rem 0 0; color: var(--text-secondary); }
.sync-box { display: grid; gap: .35rem; min-width: min(100%, 260px); text-align: right; }
.sync-box span { color: var(--text-secondary); font-size: .78rem; }
.sync-box strong { font-size: .9rem; }
.sync-box button { justify-self: end; min-width: 100px; padding: .6rem .9rem; border: 1px solid var(--primary); background: transparent; color: var(--text-main); cursor: pointer; }
.sync-box button:disabled { cursor: wait; opacity: .55; }

.boards-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; margin-top: 1.5rem; align-items: start; }
.board-card { border: 1px solid color-mix(in srgb, var(--text-main) 16%, transparent); background: var(--background); min-width: 0; }
.board-card > header { display: flex; justify-content: space-between; gap: 1rem; padding: 1rem; border-bottom: 1px solid color-mix(in srgb, var(--text-main) 13%, transparent); }
.board-card h2 { margin: 0; color: var(--title-color); font-size: 1.2rem; }
.board-card header p { margin: .35rem 0 0; color: var(--text-secondary); font-size: .82rem; }
.board-card header > span { color: var(--text-secondary); font: .72rem "SpaceMono", monospace; white-space: nowrap; }
.ranking-list { list-style: none; padding: 0; margin: 0; }
.ranking-list li { display: grid; grid-template-columns: 2.5rem minmax(0, 1fr) auto; align-items: center; gap: .6rem; min-height: 48px; padding: .55rem .8rem; border-bottom: 1px solid color-mix(in srgb, var(--text-main) 9%, transparent); }
.ranking-list li:last-child { border-bottom: 0; }
.ranking-list .rank { color: var(--text-secondary); font: 700 .76rem "SpaceMono", monospace; }
.ranking-list strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ranking-list output { color: var(--text-secondary); font: 700 .78rem "SpaceMono", monospace; text-align: right; }
.ranking-list .rank-1 { background: color-mix(in srgb, #f7c948 13%, transparent); }
.ranking-list .rank-2 { background: color-mix(in srgb, #94a3b8 11%, transparent); }
.ranking-list .rank-3 { background: color-mix(in srgb, #c77c48 10%, transparent); }
.empty-state, .loading-state, .error-state { margin: 1.5rem 0 0; padding: 1rem; border: 1px solid color-mix(in srgb, var(--text-main) 16%, transparent); color: var(--text-secondary); }
.empty-state { margin: 0; border: 0; }
.error-state { color: var(--error); border-color: color-mix(in srgb, var(--error) 45%, transparent); }

@media (max-width: 1050px) { .boards-grid { grid-template-columns: 1fr; } }
@media (max-width: 640px) {
	.rankings-hero { align-items: stretch; flex-direction: column; }
	.sync-box { text-align: left; }
	.sync-box button { justify-self: start; }
	.ranking-list li { grid-template-columns: 2rem minmax(0, 1fr); }
	.ranking-list output { grid-column: 2; text-align: left; }
}
</style>
