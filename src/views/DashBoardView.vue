<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { get } from '@/utils/request'
import { fetchAvatar } from '@/services/avatar.js'

const POLLING_INTERVAL = 3000
const { t, locale } = useI18n()

const servers = [
	{ id: 1, nameKey: 'dashboardPage.serverSurvival', description: '/server survival' },
	{ id: 4, nameKey: 'dashboardPage.serverCreative', description: '/server creative' },
]

const currentServerId = ref(1)
const onlineCount = ref(0)
const totalCount = ref(0)
const msptRaw = ref(0)
const msptSamplesRaw = ref([])
const players = ref([])
const playerAvatars = ref({})
const isLoading = ref(false)
const lastUpdatedAt = ref(null)
const fetchError = ref('')
let pollingInterval = 0
let activeRequestId = 0
const avatarCache = new Map()

const currentServer = computed(() =>
	servers.find((server) => server.id === currentServerId.value) || servers[0]
)

const serverLoad = computed(() => {
	if (!totalCount.value) {
		return 0
	}

	return Math.min(100, Math.round((onlineCount.value / totalCount.value) * 100))
})

function toMilliseconds(value) {
	const number = Number(value)

	// The status endpoint already reports MSPT in milliseconds, including
	// sub-millisecond values such as 0.036.
	return Number.isFinite(number) ? Math.max(0, number) : 0
}

const msptNumber = computed(() => toMilliseconds(msptRaw.value))

const msptSamples = computed(() =>
	msptSamplesRaw.value.map(toMilliseconds)
)

const msptAverage = computed(() => {
	if (!msptSamples.value.length) {
		return msptNumber.value
	}

	return msptSamples.value.reduce((sum, value) => sum + value, 0) / msptSamples.value.length
})

const msptChartMax = computed(() =>
	Math.max(50, msptNumber.value, ...msptSamples.value, 1)
)

const msptBars = computed(() => msptSamples.value.map((value, index) => ({
	index,
	value,
	height: Math.max(2, (value / msptChartMax.value) * 100),
	className: value >= 50 ? 'warning' : value > 35 ? 'notice' : 'normal',
})))

const msptPeak = computed(() =>
	Math.max(msptNumber.value, ...msptSamples.value, 0)
)

const msptLoad = computed(() =>
	Math.min(100, Math.max(0, Math.round((msptNumber.value / 50) * 100)))
)

function formatMspt(value) {
	const number = Number(value) || 0

	return number < 1 ? number.toFixed(3) : number.toFixed(2)
}

const performanceState = computed(() => {
	if (fetchError.value) {
		return { label: t('dashboardPage.statusOffline'), className: 'danger' }
	}

	if (msptNumber.value > 50) {
		return { label: t('dashboardPage.statusHighLoad'), className: 'warning' }
	}

	if (msptNumber.value > 35) {
		return { label: t('dashboardPage.statusBusy'), className: 'notice' }
	}

	return { label: t('dashboardPage.statusHealthy'), className: 'ok' }
})

const lastUpdatedText = computed(() => {
	if (!lastUpdatedAt.value) {
		return t('dashboardPage.waiting')
	}

	return lastUpdatedAt.value.toLocaleTimeString(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	})
})

const statCards = computed(() => [
	{
		key: 'online',
			label: t('dashboardPage.onlineCount'),
		value: onlineCount.value,
			helper: t('dashboardPage.onlinePlayers'),
	},
	{
		key: 'total',
			label: t('dashboardPage.totalAccounts'),
		value: totalCount.value,
			helper: t('dashboardPage.recordedAccounts'),
	},
	{
		key: 'mspt',
		label: 'MSPT',
		value: formatMspt(msptNumber.value),
			helper: `${msptLoad.value}% / 50ms`,
		load: msptLoad.value,
		loadScale: msptLoad.value / 100,
	},
])

function formatCoordinate(value) {
	const number = Number(value)

	if (!Number.isFinite(number)) {
		return '-'
	}

	return Math.round(number)
}

function formatHealth(value) {
	const number = Number(value)

	if (!Number.isFinite(number)) {
		return '-'
	}

	return number.toFixed(1)
}

async function getPlayerAvatar(name) {
	if (!name) {
		return null
	}

	if (avatarCache.has(name)) {
		return avatarCache.get(name)
	}

	try {
		const data = await fetchAvatar(name)
		const avatar = data?.url
			? {
				url: data.url,
				special: data.special === true,
			}
			: null
		avatarCache.set(name, avatar)
		return avatar
	} catch (error) {
		console.error('Error fetching avatar:', error)
		avatarCache.set(name, null)
		return null
	}
}

async function syncPlayerAvatars(playerList) {
	const entries = await Promise.all(
		playerList.map(async (player) => [player.name, await getPlayerAvatar(player.name)])
	)

	playerAvatars.value = Object.fromEntries(entries.filter(([name, avatar]) => name && avatar?.url))
}

function selectServer(serverId) {
	if (currentServerId.value === serverId) {
		return
	}

	currentServerId.value = serverId
}

async function fetchData() {
	const requestId = ++activeRequestId
	isLoading.value = true

	try {
		const result = await get(`https://api.glowingstone.cn/qo/download/status?id=${currentServerId.value}`)

		if (requestId !== activeRequestId) {
			return
		}

		onlineCount.value = Number(result.onlinecount || 0)
		totalCount.value = Number(result.totalcount || 0)
		// Prefer the plugin's non-destructive three-second rolling average. Older
		// servers only expose `mspt`, so keep it as a compatibility fallback.
		const rawMspt = Number(result.mspt_3s ?? result.mspt ?? 0)
		msptRaw.value = rawMspt
		msptSamplesRaw.value = Array.isArray(result.recent60) ? result.recent60 : []
		players.value = Array.isArray(result.players) ? result.players : []
		syncPlayerAvatars(players.value)
		lastUpdatedAt.value = new Date()
		fetchError.value = ''
	} catch (error) {
		if (requestId !== activeRequestId) {
			return
		}

			fetchError.value = t('dashboardPage.statusSyncFailed')
		msptSamplesRaw.value = []
		players.value = []
		playerAvatars.value = {}
	} finally {
		if (requestId === activeRequestId) {
			isLoading.value = false
		}
	}
}

function startPolling() {
	fetchData()
	pollingInterval = window.setInterval(fetchData, POLLING_INTERVAL)
}

function stopPolling() {
	window.clearInterval(pollingInterval)
	pollingInterval = 0
}

watch(currentServerId, () => {
	stopPolling()
	startPolling()
})

onMounted(startPolling)

onBeforeUnmount(stopPolling)
</script>

<template>
	<div class="dashboard page-shell">
		<section class="dashboard-hero">
			<div class="hero-copy">
					<h1>{{ t('dashboardPage.title') }}</h1>
			</div>

			<div class="status-panel" :class="performanceState.className">
				<span class="status-dot" aria-hidden="true"></span>
				<span>{{ performanceState.label }}</span>
					<small>{{ t('dashboardPage.updated', { time: lastUpdatedText }) }}</small>
			</div>
		</section>

		<section class="server-switcher" :aria-label="t('dashboardPage.serverSelection')">
			<button
				v-for="server in servers"
				:key="server.id"
				type="button"
				class="server-option"
				:class="{ active: currentServerId === server.id }"
				@click="selectServer(server.id)"
			>
					<span>{{ t(server.nameKey) }}</span>
				<small>{{ server.description }}</small>
			</button>
		</section>

		<section class="overview-grid">
			<article
				v-for="card in statCards"
				:key="card.key"
				class="metric-card"
				:class="`metric-${card.key}`"
				:style="card.loadScale !== undefined ? { '--metric-load-scale': card.loadScale } : undefined"
			>
				<span class="metric-label">{{ card.label }}</span>
				<strong>{{ card.value }}</strong>
				<span class="metric-helper">{{ card.helper }}</span>
			</article>
		</section>

		<section class="mspt-history-panel">
			<div class="section-title horizontal">
				<div>
						<h2>{{ t('dashboardPage.msptChart') }}</h2>
						<p>{{ t('dashboardPage.msptDescription') }}</p>
				</div>
				<div class="chart-current">
					<strong>{{ formatMspt(msptNumber) }} ms</strong>
						<span>{{ t('dashboardPage.currentAverage') }}</span>
						<small>{{ t('dashboardPage.average', { value: formatMspt(msptAverage) }) }}</small>
				</div>
			</div>

			<div v-if="msptBars.length" class="mspt-chart" role="img" :aria-label="t('dashboardPage.chartLabel', { count: msptBars.length, current: formatMspt(msptNumber), average: formatMspt(msptAverage), peak: formatMspt(msptPeak) })">
				<div
					class="mspt-threshold"
					:style="{ bottom: `${Math.min(100, (50 / msptChartMax) * 100)}%` }"
				>
					<span>50ms</span>
				</div>
				<div class="mspt-bars">
					<span
						v-for="bar in msptBars"
						:key="bar.index"
						class="mspt-bar"
						:class="bar.className"
						:style="{ height: `${bar.height}%` }"
						:title="`${formatMspt(bar.value)} ms`"
					></span>
				</div>
			</div>
				<div v-else class="empty-state">{{ t('dashboardPage.waitingSamples') }}</div>

			<div v-if="msptBars.length" class="chart-footer">
				<span>0ms</span>
				<span>{{ t('dashboardPage.peak', { value: formatMspt(msptPeak) }) }}</span>
			</div>
		</section>

		<section class="activity-layout">
			<article class="server-summary">
				<div class="section-title">
						<h2>{{ t(currentServer.nameKey) }}</h2>
				</div>

				<div class="load-meter">
					<div class="load-meter-header">
							<span>{{ t('dashboardPage.activity') }}</span>
						<strong>{{ serverLoad }}%</strong>
					</div>
					<div class="load-track" aria-hidden="true">
						<span :style="{ width: `${serverLoad}%` }"></span>
					</div>
				</div>

				<div class="summary-list">
					<div>
							<span>{{ t('dashboardPage.pollInterval') }}</span>
							<strong>{{ t('dashboardPage.seconds', { count: POLLING_INTERVAL / 1000 }) }}</strong>
					</div>
					<div>
							<span>{{ t('dashboardPage.syncStatus') }}</span>
							<strong>{{ isLoading ? t('common.syncing') : fetchError || t('dashboardPage.synced') }}</strong>
					</div>
					<div>
							<span>{{ t('dashboardPage.currentPlayers') }}</span>
							<strong>{{ t('dashboardPage.people', { count: players.length }) }}</strong>
					</div>
				</div>
			</article>

			<article class="players-panel">
				<div class="section-title horizontal">
					<div>
							<h2>{{ t('dashboardPage.onlinePlayersTitle') }}</h2>
							<p>{{ onlineCount ? t('dashboardPage.activePlayers') : t('dashboardPage.noPlayersOnline') }}</p>
					</div>
					<span class="player-count">{{ onlineCount }}</span>
				</div>

				<div v-if="fetchError" class="empty-state error">{{ fetchError }}</div>
					<div v-else-if="!players.length" class="empty-state">{{ t('dashboardPage.noOnlinePlayers') }}</div>
				<div v-else class="player-list">
					<div class="player-list-head" aria-hidden="true">
						<span>{{ t('dashboardPage.player') }}</span>
						<span>{{ t('dashboardPage.status') }}</span>
					</div>
					<div
						v-for="player in players"
						:key="player.name"
						class="player-row"
					>
						<div class="player-main">
							<img
								v-if="playerAvatars[player.name]?.url"
								class="player-avatar"
								:class="{ special: playerAvatars[player.name]?.special }"
								:src="playerAvatars[player.name].url"
								:alt="t('dashboardPage.avatarAlt', { name: player.name })"
								loading="lazy"
							/>
							<span v-else class="player-avatar placeholder">{{ player.name?.slice(0, 1) || '?' }}</span>
							<div>
								<strong>{{ player.name }}</strong>
								<span>Ping {{ player.ping ?? '-' }}ms</span>
							</div>
						</div>
						<div class="player-meta">
							<span class="health-value">HP {{ formatHealth(player.health) }}</span>
							<!--<span class="coordinate-value">{{ formatCoordinate(player.x) }}, {{ formatCoordinate(player.y) }}, {{ formatCoordinate(player.z) }}</span>-->
								<span class="coordinate-value">{{ t('dashboardPage.coordinatesDisabled') }}</span>
						</div>
					</div>
				</div>
			</article>
		</section>
	</div>
</template>

<style scoped>
.dashboard {
	--dashboard-surface: color-mix(in srgb, var(--background) 96%, var(--primary));
	--dashboard-surface-muted: var(--page-background);
	--dashboard-line: color-mix(in srgb, var(--text-main) 13%, transparent);
	--dashboard-line-strong: color-mix(in srgb, var(--text-main) 24%, transparent);
	--dashboard-soft: color-mix(in srgb, var(--text-main) 4%, transparent);
	--dashboard-blue-soft: color-mix(in srgb, var(--primary) 13%, transparent);
	--dashboard-green-soft: color-mix(in srgb, var(--success) 13%, transparent);
	--dashboard-yellow-soft: color-mix(in srgb, var(--warning) 16%, transparent);
	width: 100%;
	height: 100%;
	min-height: 0;
	padding: 1rem;
	background: var(--page-background);
	color: var(--text-main);
	overflow: auto;
	-webkit-font-smoothing: antialiased;
}

:global(:root[data-theme='dark'] .dashboard) {
	--dashboard-surface: #101722;
	--dashboard-surface-muted: #0C1118;
	--dashboard-line: #29384A;
	--dashboard-line-strong: #40546D;
	--dashboard-soft: color-mix(in srgb, var(--dark-text-primary) 7%, transparent);
	--dashboard-blue-soft: color-mix(in srgb, var(--primary) 16%, #101722);
	--dashboard-green-soft: color-mix(in srgb, var(--success) 13%, #101722);
	--dashboard-yellow-soft: color-mix(in srgb, var(--warning) 15%, #101722);
}

.dashboard-hero,
.server-switcher,
.overview-grid,
.mspt-history-panel,
.activity-layout {
	width: min(1280px, 100%);
	margin: 0 auto;
}

.dashboard-hero {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 1rem;
	padding: 0.65rem 0 1rem;
}

.hero-copy {
	display: grid;
	gap: 0.65rem;
	max-width: 760px;
}

.hero-copy h1,
.section-title h2 {
	margin: 0;
	color: var(--title-color);
	line-height: 1.1;
}

.hero-copy h1 {
	font-size: clamp(2rem, 4.8vw, 4rem);
	font-weight: 520;
	letter-spacing: 0;
}

.status-panel {
	flex: 0 0 auto;
	display: grid;
	grid-template-columns: auto auto;
	align-items: center;
	gap: 0.2rem 0.55rem;
	border: 1px solid var(--dashboard-line);
	background: color-mix(in srgb, var(--dashboard-surface) 94%, transparent);
	padding: 0.82rem 0.95rem;
	min-width: 184px;
	box-sizing: border-box;
}

.status-panel small {
	grid-column: 2;
	color: var(--text-secondary);
}

.status-dot {
	width: 0.6rem;
	height: 0.6rem;
	background: var(--success);
}

.status-panel.notice .status-dot {
	background: var(--primary);
}

.status-panel.warning .status-dot {
	background: var(--warning);
}

.status-panel.danger .status-dot {
	background: var(--error);
}

.server-switcher {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 1px;
	margin-bottom: 1rem;
	border: 1px solid var(--dashboard-line);
	background: var(--dashboard-line);
}

.server-option {
	border: none;
	background: color-mix(in srgb, var(--dashboard-surface) 96%, transparent);
	color: var(--text-main);
	padding: 1rem 1.05rem;
	text-align: left;
	display: grid;
	gap: 0.25rem;
	cursor: pointer;
	position: relative;
	overflow: hidden;
	transition:
		background-color 160ms ease,
		color 160ms ease;
}

.server-option::before {
	content: '';
	position: absolute;
	left: 0;
	top: 0;
	bottom: 0;
	width: 3px;
	background: var(--primary);
	transform: scaleY(0);
	transition: transform 160ms ease;
}

.server-option span {
	font-size: 1rem;
	font-weight: 700;
}

.server-option small {
	color: currentColor;
	opacity: 0.68;
	line-height: 1.4;
}

.server-option:hover,
.server-option.active {
	background: color-mix(in srgb, var(--dashboard-blue-soft) 84%, var(--dashboard-surface));
	color: var(--text-main);
}

.server-option.active::before {
	transform: scaleY(1);
}

.overview-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 1rem;
	margin-bottom: 1rem;
}

.metric-card,
.server-summary,
.players-panel {
	border: 1px solid var(--dashboard-line);
	background: color-mix(in srgb, var(--dashboard-surface) 96%, transparent);
}

.metric-card {
	display: grid;
	grid-template-rows: auto 1fr auto;
	gap: 0.7rem;
	padding: 1.05rem;
	min-height: 156px;
	box-sizing: border-box;
	position: relative;
	overflow: hidden;
}

.metric-card::after {
	content: '';
	position: absolute;
	left: 1rem;
	width: calc(100% - 2rem);
	bottom: 0;
	height: 2px;
	background: var(--primary);
	transform-origin: left center;
}

.metric-online::after {
	background: var(--success);
}

.metric-mspt::after {
	background: var(--warning);
	transform: scaleX(var(--metric-load-scale, 0));
}

.metric-mspt {
	--metric-load-scale: 0;
}

.metric-mspt::before {
	content: '';
	position: absolute;
	left: 1rem;
	right: 1rem;
	bottom: 0;
	height: 2px;
	background: color-mix(in srgb, var(--text-main) 10%, transparent);
}

.metric-label,
.metric-helper,
.summary-list span,
.load-meter-header span,
.player-main span,
.player-meta {
	color: var(--text-secondary);
}

.metric-label {
	font-size: 0.85rem;
	font-weight: 700;
}

.metric-card strong {
	color: var(--title-color);
	font-size: clamp(2rem, 5vw, 3.4rem);
	line-height: 0.95;
	font-weight: 500;
	font-family: 'SpaceMono', 'Inter', sans-serif;
	align-self: center;
}

.metric-helper {
	font-size: 0.9rem;
}

.mspt-history-panel {
	border: 1px solid var(--dashboard-line);
	background: color-mix(in srgb, var(--dashboard-surface) 96%, transparent);
	padding: 1.1rem;
	margin-bottom: 1rem;
	box-sizing: border-box;
}

.mspt-history-panel .section-title.horizontal {
	margin-bottom: 1.15rem;
}

.mspt-history-panel .section-title p {
	margin: 0.35rem 0 0;
	color: var(--text-secondary);
	font-size: 0.9rem;
}

.chart-current {
	display: grid;
	gap: 0.15rem;
	text-align: right;
}

.chart-current strong {
	color: var(--title-color);
	font: 500 1.35rem/1 'SpaceMono', 'Inter', sans-serif;
}

.chart-current span {
	color: var(--text-secondary);
	font-size: 0.78rem;
}

.chart-current small {
	color: var(--text-secondary);
	font-size: 0.78rem;
}

.mspt-chart {
	height: 180px;
	position: relative;
	border-bottom: 1px solid var(--dashboard-line-strong);
	background: repeating-linear-gradient(
		to top,
		transparent 0,
		transparent calc(25% - 1px),
		var(--dashboard-line) 25%
	);
}

.mspt-bars {
	position: absolute;
	inset: 0 0 0.45rem;
	display: flex;
	align-items: flex-end;
	gap: 2px;
}

.mspt-bar {
	flex: 1 1 0;
	min-width: 2px;
	background: var(--success);
	opacity: 0.88;
	transition: height var(--motion-fast) ease, opacity var(--motion-fast) ease;
}

.mspt-bar.notice {
	background: var(--primary);
}

.mspt-bar.warning {
	background: var(--warning);
	box-shadow: 0 0 0 1px color-mix(in srgb, var(--warning) 35%, transparent);
}

.mspt-bar:hover {
	opacity: 1;
}

.mspt-threshold {
	position: absolute;
	left: 0;
	right: 0;
	z-index: 1;
	border-top: 1px dashed color-mix(in srgb, var(--warning) 56%, transparent);
	pointer-events: none;
}

.mspt-threshold span {
	position: absolute;
	right: 0;
	top: -1.25rem;
	padding-left: 0.35rem;
	background: var(--dashboard-surface);
	color: var(--warning);
	font: 0.7rem/1 'SpaceMono', 'Inter', sans-serif;
}

.chart-footer {
	display: flex;
	justify-content: space-between;
	margin-top: 0.55rem;
	color: var(--text-secondary);
	font: 0.72rem/1 'SpaceMono', 'Inter', sans-serif;
}

.activity-layout {
	display: grid;
	grid-template-columns: minmax(260px, 0.8fr) minmax(0, 1.6fr);
	gap: 1rem;
	min-height: 0;
}

.server-summary,
.players-panel {
	padding: 1.1rem;
	box-sizing: border-box;
}

.server-summary {
	display: flex;
	flex-direction: column;
	gap: 1.3rem;
}

.section-title {
	display: grid;
	gap: 0.45rem;
}

.section-title.horizontal {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 1rem;
}

.load-meter {
	display: grid;
	gap: 0.7rem;
	padding: 1rem;
	border: 1px solid var(--dashboard-line);
	background: color-mix(in srgb, var(--dashboard-soft) 76%, transparent);
}

.load-meter-header,
.summary-list div,
.player-row,
.player-main,
.player-meta {
	display: flex;
	align-items: center;
}

.load-meter-header,
.summary-list div,
.player-row {
	justify-content: space-between;
	gap: 1rem;
}

.load-track {
	height: 0.5rem;
	background: color-mix(in srgb, var(--text-main) 7%, transparent);
	overflow: hidden;
}

.load-track span {
	display: block;
	height: 100%;
	background: var(--primary);
	transition: width 180ms ease;
}

.summary-list {
	display: grid;
	border-top: 1px solid var(--dashboard-line);
}

.summary-list div {
	padding: 0.85rem 0;
	border-bottom: 1px solid var(--dashboard-line);
}

.player-count {
	min-width: 2.4rem;
	height: 2.4rem;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: var(--dashboard-blue-soft);
	color: var(--title-color);
	border: 1px solid var(--dashboard-line-strong);
	font-weight: 700;
}

.empty-state {
	border: 1px dashed var(--dashboard-line-strong);
	background: var(--dashboard-soft);
	color: var(--text-secondary);
	padding: 2.2rem 1rem;
	text-align: center;
}

.empty-state.error {
	color: var(--error);
	border-color: color-mix(in srgb, var(--error) 42%, var(--split));
}

.player-list {
	display: grid;
	border: 1px solid var(--dashboard-line);
	background: var(--dashboard-line);
	gap: 1px;
}

.player-list-head,
.player-row {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	align-items: center;
	gap: 1rem;
	background: color-mix(in srgb, var(--dashboard-surface) 96%, transparent);
}

.player-list-head {
	padding: 0.65rem 0.8rem;
	color: var(--text-secondary);
	font-size: 0.78rem;
	font-weight: 700;
}

.player-row {
	padding: 0.8rem;
	border-bottom: none;
	transition:
		background-color 160ms ease,
		transform 160ms ease;
}

.player-row:hover {
	background: color-mix(in srgb, var(--dashboard-blue-soft) 82%, var(--dashboard-surface));
}

.player-main {
	gap: 0.75rem;
	min-width: 0;
}

.player-main div {
	min-width: 0;
	display: grid;
	gap: 0.2rem;
}

.player-main strong {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.player-avatar {
	width: 2.4rem;
	height: 2.4rem;
	display: block;
	object-fit: cover;
	background: var(--dashboard-surface-muted);
	border: 1px solid var(--dashboard-line-strong);
	flex: 0 0 auto;
}

.player-avatar.special {
	image-rendering: pixelated;
}

.player-avatar.placeholder {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: var(--text-main);
	font-weight: 800;
	text-transform: uppercase;
}

.player-meta {
	gap: 0.75rem;
	font-size: 0.9rem;
	text-align: right;
	white-space: nowrap;
}

.health-value,
.coordinate-value {
	display: inline-flex;
	align-items: center;
	min-height: 1.65rem;
	padding: 0 0.55rem;
	background: var(--dashboard-soft);
	border: 1px solid var(--dashboard-line);
	color: var(--text-main);
}

.health-value {
	color: var(--success);
}

button:focus-visible {
	outline: 2px solid var(--primary);
	outline-offset: 2px;
}

@media (max-width: 900px) {
	.dashboard-hero {
		display: grid;
		align-items: start;
	}

	.activity-layout {
		grid-template-columns: 1fr;
	}

	.status-panel {
		width: 100%;
	}

	.overview-grid {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 640px) {
	.dashboard {
		padding: 0.75rem;
	}

	.server-switcher {
		grid-template-columns: 1fr;
	}

	.player-list-head {
		display: none;
	}

	.player-row {
		grid-template-columns: 1fr;
		align-items: start;
	}

	.player-meta {
		align-items: flex-start;
	}

	.player-meta {
		flex-wrap: wrap;
		gap: 0.25rem;
		text-align: left;
		padding-left: 3rem;
	}
}
</style>
