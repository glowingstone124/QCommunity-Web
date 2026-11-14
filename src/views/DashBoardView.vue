<script setup>
import { computed } from 'vue'
import { useDashboardStatus } from '@/composables/useDashboardStatus.js'
import { useUiPreferences } from '@/composables/useUiPreferences.js'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'
import UiTabs from '@/components/ui/UiTabs.vue'
import UiStatGrid from '@/components/ui/UiStatGrid.vue'
import UiStatCard from '@/components/ui/UiStatCard.vue'
import UiStatePanel from '@/components/ui/UiStatePanel.vue'

const { isModernUi } = useUiPreferences()

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

const serverTabItems = computed(() =>
	servers.value.map((server) => ({
		key: server.id,
		label: t(server.nameKey),
		description: server.description,
	}))
)

function statIcon(key) {
	if (key === 'online') return 'group'
	if (key === 'total') return 'badge'
	if (key === 'mspt') return 'speed'
	return 'analytics'
}

function statTone(key) {
	if (key === 'online') return 'primary'
	if (key === 'mspt') {
		if (msptNumber.value > 50) return 'error'
		if (msptNumber.value > 35) return 'warning'
		return 'success'
	}
	return 'default'
}
</script>

<template>
	<div class="dashboard page-shell">
		<UiPageHeader
			class="dashboard-section"
			:title="t('dashboardPage.title')"
		>
			<template #actions>
				<div class="status-panel" :class="performanceState.className">
					<span class="status-dot" aria-hidden="true"></span>
					<span>{{ performanceState.label }}</span>
					<small>{{ t('dashboardPage.updated', { time: lastUpdatedText }) }}</small>
				</div>
			</template>

			<UiTabs
				:model-value="currentServerId"
				variant="segmented"
				:items="serverTabItems"
				:aria-label="t('dashboardPage.serverSelection')"
				@select="(item) => selectServer(item.key)"
			/>
		</UiPageHeader>

		<UiStatGrid class="dashboard-section" :columns="3">
			<UiStatCard
				v-for="card in statCards"
				:key="card.key"
				:label="card.label"
				:value="card.value"
				:helper="card.helper"
				:icon="statIcon(card.key)"
				:tone="statTone(card.key)"
			/>
		</UiStatGrid>

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
				<UiStatePanel
					v-else
					state="info"
					icon="analytics"
					compact
					:message="t('dashboardPage.waitingSamples')"
				/>

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
					<md-linear-progress
						v-if="isModernUi"
						:value.prop="Math.max(0, Math.min(1, Number(serverLoad || 0) / 100))"
						:aria-label="t('dashboardPage.activity')"
					/>
					<div v-else class="load-track" aria-hidden="true">
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

				<UiStatePanel
					v-if="fetchError"
					state="error"
					compact
					:message="fetchError"
				/>
				<UiStatePanel
					v-else-if="!players.length"
					state="empty"
					icon="group_off"
					compact
					:message="t('dashboardPage.noOnlinePlayers')"
				/>
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
