<script setup>
import { useDashboardStatus } from '@/composables/useDashboardStatus.js'

const {
	POLLING_INTERVAL,
	currentServer,
	currentServerId,
	fetchError,
	formatHealth,
	formatMspt,
	isLoading,
	lastUpdatedText,
	msptAverage,
	msptBars,
	msptChartMax,
	msptNumber,
	msptPeak,
	onlineCount,
	performanceState,
	playerAvatars,
	players,
	selectServer,
	servers,
	serverLoad,
	statCards,
	t,
} = useDashboardStatus()
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

<style scoped src="./DashBoardView.css"></style>
<style scoped src="./DashBoardViewResponsive.css"></style>
