<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiStatCard from '@/components/ui/UiStatCard.vue'
import UiStatGrid from '@/components/ui/UiStatGrid.vue'
import UiStatePanel from '@/components/ui/UiStatePanel.vue'
import {collapseSchedule} from '@/data/collapse.js'

const props = defineProps({
	isFrozen: {
		type: [Boolean, null],
		default: null,
	},
	logins: {
		type: Array,
		default: () => [],
	},
	playtime: {
		type: Number,
		default: 0,
	},
	statistics: {
		type: Object,
		default: () => ({}),
	},
	statusHint: {
		type: String,
		default: '',
	},
	uid: {
		type: Number,
		default: 0,
	},
	username: {
		type: String,
		default: '',
	},
	fallenSelection: {
		type: Object,
		default: null,
	},
})
const { t, locale } = useI18n()

const teamNames = {
	A: 'collapsePage.teamA',
	B: 'collapsePage.teamB',
	C: 'collapsePage.teamC',
}

function formatDate(timestamp) {
	const date = new Date(timestamp)
	return date.toLocaleString(locale.value === 'zh' ? 'zh-CN' : 'en-US')
}

function statisticValue(key) {
	const value = Number(props.statistics?.[key] ?? 0)
	return Number.isFinite(value) && value > 0 ? value : 0
}

function formatDistance(centimeters) {
	const meters = centimeters / 100
	if (meters < 1_000) return t('accountOverview.meters', { count: Math.round(meters).toLocaleString(locale.value === 'zh' ? 'zh-CN' : 'en-US') })
	return t('accountOverview.kilometers', { count: (meters / 1_000).toLocaleString(locale.value === 'zh' ? 'zh-CN' : 'en-US', { maximumFractionDigits: 2 }) })
}

function formatDamage(rawDamage) {
	return t('accountOverview.damagePoints', { count: (rawDamage / 10).toLocaleString(locale.value === 'zh' ? 'zh-CN' : 'en-US', { maximumFractionDigits: 1 }) })
}

function formatDuration(ticks) {
	const seconds = Math.floor(ticks / 20)
	if (seconds < 60) return t('accountOverview.seconds', { count: seconds })
	const minutes = Math.floor(seconds / 60)
	const hours = Math.floor(minutes / 60)
	return hours
		? [t('accountOverview.hours', { count: hours }), t('accountOverview.minutes', { count: minutes % 60 })].join(' ')
		: t('accountOverview.minutes', { count: minutes })
}

const gameStatisticItems = computed(() => [
	{ label: t('accountOverview.distance'), value: formatDistance(statisticValue('distance_cm')) },
	{ label: t('accountOverview.damage'), value: formatDamage(statisticValue('damage_dealt')) },
	{ label: t('accountOverview.mobKills'), value: statisticValue('mob_kills').toLocaleString() },
	{ label: t('accountOverview.blocksMined'), value: statisticValue('blocks_mined').toLocaleString() },
	{ label: t('accountOverview.blocksPlaced'), value: statisticValue('blocks_placed').toLocaleString() },
	{ label: t('accountOverview.elytraFlight'), value: formatDuration(statisticValue('elytra_flight_ticks')) },
])
</script>

<template>
	<section class="panel">
		<header class="panel-header">
			<div>
				<h2 class="panel-title">{{ t('accountOverview.title') }}</h2>
				<p class="panel-sub">{{ t('accountOverview.description') }}</p>
			</div>
			<span class="pill">{{ t('accountOverview.boundQq', { uid: uid || '—' }) }}</span>
		</header>
		<UiStatGrid class="overview-stat-grid">
			<UiStatCard
				:label="t('accountOverview.username')"
				:value="username || '—'"
				icon="person"
			/>
			<UiStatCard
				:label="t('accountOverview.playtime')"
				:value="t('accountOverview.minutes', { count: playtime })"
				icon="schedule"
			/>
			<UiStatCard
				:label="t('accountOverview.loginCount')"
				:value="logins.length"
				icon="login"
			/>
			<UiStatCard
				:label="t('accountOverview.accountStatus')"
				:value="statusHint || t('accountPage.statusChecking')"
				:icon="isFrozen ? 'gpp_bad' : 'verified_user'"
				:tone="isFrozen ? 'error' : 'success'"
			/>
			<UiStatCard
				:label="fallenSelection?.finalized ? t('accountOverview.currentFaction') : t('accountOverview.expectedFaction')"
				:value="fallenSelection ? t(teamNames[fallenSelection.team]) : t('accountOverview.notSelected')"
				icon="flag"
				tone="primary"
			>
				<small v-if="fallenSelection && !fallenSelection.finalized" class="faction-activity-note">
					{{ t('accountOverview.activityStarts', { date: collapseSchedule.startDateShortText[locale] || collapseSchedule.startDateShortText.zh }) }}
				</small>
			</UiStatCard>
			<UiStatCard
				v-for="item in gameStatisticItems"
				:key="item.label"
				:label="item.label"
				:value="item.value"
				icon="analytics"
			/>
		</UiStatGrid>
		<div class="section">
			<div class="section-title">{{ t('accountOverview.loginHistory') }}</div>
			<div v-if="logins.length" class="record-grid">
				<div
					v-for="(login, index) in logins"
					:key="index"
					class="login-record"
					:class="{ success: login.success, fail: !login.success }"
				>
					<h2>{{ login.success ? t('accountOverview.success') : t('accountOverview.failed') }}</h2>
					<p>{{ formatDate(login.date) }}</p>
				</div>
			</div>
			<UiStatePanel v-else state="empty" compact :message="t('accountOverview.noLoginHistory')" />
		</div>
	</section>
</template>

<style scoped>
.panel {
	background: var(--glass-strong);
	border-radius: 0;
	padding: 1.4rem;
	border: none;
	display: flex;
	flex-direction: column;
	gap: 1.35rem;
	min-height: 100%;
	max-width: 1120px;
	width: 100%;
	margin: 0 auto;
	box-sizing: border-box;
}

.panel-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 1rem;
	animation: overview-item-in 420ms var(--ease-out) both;
}

.panel-title {
	font-size: 1.45rem;
	margin: 0;
	color: var(--title-color);
	line-height: 1.2;
}

.panel-sub {
	margin: 0.25rem 0 0;
	color: var(--text-secondary);
}

.pill {
	padding: 0.35rem 0.65rem;
	border-radius: 0;
	background: var(--surface-soft);
	border: 1px solid var(--border-soft);
	color: var(--text-main);
	font-size: 0.86rem;
	white-space: nowrap;
}

.stats {
	display: grid;
	grid-template-columns: repeat(5, minmax(0, 1fr));
	border: 1px solid var(--border-soft);
	border-radius: 0;
	overflow: hidden;
}

.stat-card {
	background: transparent;
	border-radius: 0;
	padding: 1rem;
	border: none;
	border-right: 1px solid var(--border-soft);
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
	opacity: 0;
	animation: overview-item-in 380ms var(--ease-out) forwards;
}

.stat-card:nth-child(1) { animation-delay: 70ms; }
.stat-card:nth-child(2) { animation-delay: 110ms; }
.stat-card:nth-child(3) { animation-delay: 150ms; }
.stat-card:nth-child(4) { animation-delay: 190ms; }
.stat-card:nth-child(5) { animation-delay: 230ms; }

.stat-card:last-child {
	border-right: none;
}

.stat-label {
	margin: 0;
	color: var(--text-secondary);
	font-size: 0.9rem;
}

.stat-value {
	margin: 0;
	font-size: 1.18rem;
	color: var(--text-main);
	font-weight: 600;
	word-break: break-word;
}

.status-ok {
	color: var(--success-text);
}

.status-frozen {
	color: var(--error-text);
}

.faction-value {
	color: var(--primary);
}

.faction-card small {
	color: var(--text-secondary);
	font-size: 0.76rem;
	line-height: 1.35;
}

.stat-num {
	font-size: 1.35rem;
}

.section {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	border: 1px solid var(--border-soft);
	border-radius: 0;
	padding: 1rem;
	opacity: 0;
	animation: overview-item-in 200ms var(--ease-out) 60ms forwards;
}

.section-title {
	font-size: 1rem;
	font-weight: 600;
	color: var(--title-color);
}

.record-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 0.65rem;
}

.login-record {
	border-radius: 0;
	background: var(--surface-soft);
	padding: 0.82rem 0.9rem;
	border: 1px solid var(--border-soft);
	animation: overview-record-in 360ms var(--ease-out) both;
}

.login-record:nth-child(2) { animation-delay: 45ms; }
.login-record:nth-child(3) { animation-delay: 90ms; }

.login-record.success {
	border-color: color-mix(in srgb, var(--success) 42%, var(--border-soft));
}

.login-record.fail {
	border-color: color-mix(in srgb, var(--error) 42%, var(--border-soft));
}

.login-record h2 {
	margin: 0 0 0.35rem;
	font-size: 1rem;
	color: var(--text-main);
}

.login-record p,
.empty {
	margin: 0;
	color: var(--text-secondary);
	font-size: 0.95rem;
}

@keyframes overview-item-in {
	from { opacity: 0; transform: translateY(12px); }
	to { opacity: 1; transform: translateY(0); }
}

@keyframes overview-record-in {
	from { opacity: 0; transform: translateX(-8px); }
	to { opacity: 1; transform: translateX(0); }
}

@media (max-width: 960px) {
	.panel {
		padding: 1rem;
		min-height: unset;
	}

	.panel-header {
		flex-direction: column;
		align-items: flex-start;
	}

	.stats {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.stat-card:nth-child(2) {
		border-right: none;
	}

	.stat-card:nth-child(4) {
		border-right: none;
	}

	.stat-card:not(:last-child) {
		border-bottom: 1px solid var(--border-soft);
	}
}

@media (max-width: 640px) {
	.panel-title {
		font-size: 1.35rem;
	}

	.stats,
	.record-grid {
		grid-template-columns: 1fr;
	}

	.stat-card {
		border-right: none;
		border-bottom: 1px solid var(--border-soft);
	}

	.stat-card:last-child {
		border-bottom: none;
	}
}

@media (prefers-reduced-motion: reduce) {
	.panel-header,
	.stat-card,
	.section,
	.login-record {
		opacity: 1;
		animation: none;
		transform: none;
	}
}

/* Material Design 3 Overview Tonal Cards */
.overview-stat-grid {
	grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
	gap: 0.75rem;
}

.faction-activity-note {
	color: var(--text-secondary);
	font-size: 0.78rem;
	line-height: 1.4;
}

:global(:root[data-ui="modern"] .account .overview-stat-grid .ui-stat-card) {
	border: none;
	border-radius: var(--md-sys-shape-corner-large);
	background: var(--md-sys-color-surface-container);
	padding: 1.15rem 1.2rem;
	box-shadow: var(--md-sys-elevation-level1);
}

:global(:root[data-ui="modern"] .account .overview-stat-grid .ui-stat-card__value) {
	font-size: clamp(1.08rem, 1.45vw, 1.35rem);
	line-height: 1.24;
}

:global(:root[data-ui="modern"] .account .section) {
	border: none;
	border-radius: var(--md-sys-shape-corner-large);
	background: var(--md-sys-color-surface-container);
	padding: 1.25rem;
}

:global(:root[data-ui="modern"] .account .login-record) {
	border-radius: var(--md-sys-shape-corner-medium);
	background: var(--md-sys-color-surface-container-low);
	border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 50%, transparent);
}

:global(:root[data-ui="modern"] .account .login-record.success) {
	border-color: color-mix(in srgb, var(--md-sys-color-success) 45%, transparent);
	background: color-mix(in srgb, var(--md-sys-color-success-container) 35%, var(--md-sys-color-surface-container-low));
}

:global(:root[data-ui="modern"] .account .login-record.fail) {
	border-color: color-mix(in srgb, var(--md-sys-color-error) 45%, transparent);
	background: color-mix(in srgb, var(--md-sys-color-error-container) 35%, var(--md-sys-color-surface-container-low));
}
</style>
