<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { get } from '@/utils/request'

const POLLING_INTERVAL = 3000

const servers = [
	{ id: 1, name: '生存服', description: '/server survival' },
	{ id: 4, name: '创造服', description: '/server creative' },
]

const currentServerId = ref(1)
const onlineCount = ref(0)
const totalCount = ref(0)
const mspt = ref(0)
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

const msptNumber = computed(() => Number(mspt.value) || 0)

const msptLoad = computed(() =>
	Math.min(100, Math.max(0, Math.round((msptNumber.value / 50) * 100)))
)

const performanceState = computed(() => {
	if (fetchError.value) {
		return { label: '离线', className: 'danger' }
	}

	if (msptNumber.value > 50) {
		return { label: '高负载', className: 'warning' }
	}

	if (msptNumber.value > 35) {
		return { label: '繁忙', className: 'notice' }
	}

	return { label: '运行正常', className: 'ok' }
})

const lastUpdatedText = computed(() => {
	if (!lastUpdatedAt.value) {
		return '等待同步'
	}

	return lastUpdatedAt.value.toLocaleTimeString('zh-CN', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	})
})

const statCards = computed(() => [
	{
		key: 'online',
		label: '在线人数',
		value: onlineCount.value,
		helper: '当前服务器在线玩家',
	},
	{
		key: 'total',
		label: '总账户数',
		value: totalCount.value,
		helper: '已记录玩家账户',
	},
	{
		key: 'mspt',
		label: 'MSPT',
		value: msptNumber.value.toFixed(2),
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
		const response = await fetch(`https://api.glowingstone.cn/qo/download/avatar?name=${encodeURIComponent(name)}`)
		const data = await response.json()
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
		mspt.value = Number(result.mspt || 0)
		players.value = Array.isArray(result.players) ? result.players : []
		syncPlayerAvatars(players.value)
		lastUpdatedAt.value = new Date()
		fetchError.value = ''
	} catch (error) {
		if (requestId !== activeRequestId) {
			return
		}

		fetchError.value = '服务器状态同步失败'
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
				<h1>服务器仪表板</h1>
				<p>实时查看 Quantum Original 服务器在线状态、性能指标与玩家活动。</p>
			</div>

			<div class="status-panel" :class="performanceState.className">
				<span class="status-dot" aria-hidden="true"></span>
				<span>{{ performanceState.label }}</span>
				<small>更新于 {{ lastUpdatedText }}</small>
			</div>
		</section>

		<section class="server-switcher" aria-label="服务器选择">
			<button
				v-for="server in servers"
				:key="server.id"
				type="button"
				class="server-option"
				:class="{ active: currentServerId === server.id }"
				@click="selectServer(server.id)"
			>
				<span>{{ server.name }}</span>
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

		<section class="activity-layout">
			<article class="server-summary">
				<div class="section-title">
					<h2>{{ currentServer.name }}</h2>
					<p>{{ currentServer.description }}</p>
				</div>

				<div class="load-meter">
					<div class="load-meter-header">
						<span>账户活跃度</span>
						<strong>{{ serverLoad }}%</strong>
					</div>
					<div class="load-track" aria-hidden="true">
						<span :style="{ width: `${serverLoad}%` }"></span>
					</div>
				</div>

				<div class="summary-list">
					<div>
						<span>轮询间隔</span>
						<strong>{{ POLLING_INTERVAL / 1000 }} 秒</strong>
					</div>
					<div>
						<span>同步状态</span>
						<strong>{{ isLoading ? '同步中' : fetchError || '已同步' }}</strong>
					</div>
					<div>
						<span>当前玩家</span>
						<strong>{{ players.length }} 人</strong>
					</div>
				</div>
			</article>

			<article class="players-panel">
				<div class="section-title horizontal">
					<div>
						<h2>在线玩家</h2>
						<p>{{ onlineCount ? '当前服务器活动玩家列表' : '当前没有玩家在线' }}</p>
					</div>
					<span class="player-count">{{ onlineCount }}</span>
				</div>

				<div v-if="fetchError" class="empty-state error">{{ fetchError }}</div>
				<div v-else-if="!players.length" class="empty-state">暂无在线玩家</div>
				<div v-else class="player-list">
					<div class="player-list-head" aria-hidden="true">
						<span>玩家</span>
						<span>状态</span>
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
								:alt="`${player.name} 的头像`"
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
							<span class="coordinate-value">{{ formatCoordinate(player.x) }}, {{ formatCoordinate(player.y) }}, {{ formatCoordinate(player.z) }}</span>
						</div>
					</div>
				</div>
			</article>
		</section>
	</div>
</template>

<style scoped>
.dashboard {
	--dashboard-surface: color-mix(in srgb, var(--background) 94%, var(--primary));
	--dashboard-surface-muted: color-mix(in srgb, var(--background-secondary) 92%, var(--primary));
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
	background: var(--dashboard-surface-muted);
	color: var(--text-main);
	overflow: auto;
}

:global(:root[data-theme='dark'] .dashboard) {
	--dashboard-surface: color-mix(in srgb, var(--background-secondary) 82%, var(--primary));
	--dashboard-surface-muted: color-mix(in srgb, var(--background) 88%, var(--primary));
	--dashboard-line: color-mix(in srgb, var(--dark-text-primary) 14%, transparent);
	--dashboard-line-strong: color-mix(in srgb, var(--dark-text-primary) 24%, transparent);
	--dashboard-soft: color-mix(in srgb, var(--dark-text-primary) 6%, transparent);
}

.dashboard-hero,
.server-switcher,
.overview-grid,
.activity-layout {
	width: min(1280px, 100%);
	margin: 0 auto;
}

.dashboard-hero {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 1rem;
	padding: 0.75rem 0 1.15rem;
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
	font-size: clamp(2.4rem, 6vw, 5.2rem);
	font-weight: 520;
	letter-spacing: 0;
}

.hero-copy p,
.section-title p {
	margin: 0;
	color: var(--text-secondary);
	line-height: 1.55;
}

.status-panel {
	flex: 0 0 auto;
	display: grid;
	grid-template-columns: auto auto;
	align-items: center;
	gap: 0.2rem 0.55rem;
	border: 1px solid var(--dashboard-line);
	background: color-mix(in srgb, var(--dashboard-surface) 88%, transparent);
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
	border-radius: 50%;
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
	background: color-mix(in srgb, var(--dashboard-surface) 94%, transparent);
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
	background: var(--dashboard-blue-soft);
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
	background: color-mix(in srgb, var(--dashboard-surface) 92%, transparent);
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
	height: 3px;
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
	height: 3px;
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
	font-size: clamp(2.3rem, 6vw, 4rem);
	line-height: 0.95;
	font-weight: 500;
	font-family: 'SpaceMono', 'Inter', sans-serif;
	align-self: center;
}

.metric-helper {
	font-size: 0.9rem;
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
	background: var(--dashboard-soft);
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
	height: 0.65rem;
	background: color-mix(in srgb, var(--text-main) 8%, transparent);
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
	background: var(--text-main);
	color: var(--background);
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
	background: color-mix(in srgb, var(--dashboard-surface) 95%, transparent);
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
	background: var(--dashboard-blue-soft);
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
	background: var(--background-secondary);
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
