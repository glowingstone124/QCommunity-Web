<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ArtCardForQueryUsage from '@/components/ArtCardForQueryUsage.vue'

interface Props {
	username: string
	avatar?: string
	banned: boolean
	online: boolean
	qq?: string
	found?: boolean
	playtime?: number
	lastLogin?: number | string | null
	statistics?: Record<string, number | string | null | undefined>
}

const props = defineProps<Props>()
const { t, locale } = useI18n()

const statusText = computed(() => {
	if (props.banned) return t('playerCard.frozen')
	return props.online ? t('playerCard.online') : t('playerCard.offline')
})

const statusClass = computed(() => ({
	'status-banned': props.banned,
	'status-online': !props.banned && props.online,
	'status-offline': !props.banned && !props.online,
}))

const playtimeText = computed(() => {
	const minutes = Number(props.playtime || 0)
	if (minutes <= 0) return t('playerCard.noRecord')
	if (minutes < 60) return t('accountOverview.minutes', { count: minutes })
	const hours = Math.floor(minutes / 60)
	const rest = minutes % 60
	return rest
		? [t('accountOverview.hours', { count: hours }), t('accountOverview.minutes', { count: rest })].join(' ')
		: t('accountOverview.hours', { count: hours })
})

const lastLoginText = computed(() => {
	const rawTimestamp = Number(props.lastLogin)
	if (!Number.isFinite(rawTimestamp) || rawTimestamp <= 0) return t('playerCard.noRecord')

	const timestamp = rawTimestamp < 1_000_000_000_000 ? rawTimestamp * 1000 : rawTimestamp
	const date = new Date(timestamp)
	if (Number.isNaN(date.getTime())) return t('playerCard.noRecord')

	const formatted = new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	}).format(date)

	return props.online ? t('playerCard.currentlyOnline', { time: formatted }) : formatted
})

function statisticValue(key: string) {
	const value = Number(props.statistics?.[key] ?? 0)
	return Number.isFinite(value) && value > 0 ? value : 0
}

function formatDistance(centimeters: number) {
	const meters = centimeters / 100
	if (meters < 1_000) return t('accountOverview.meters', { count: Math.round(meters).toLocaleString(locale.value === 'zh' ? 'zh-CN' : 'en-US') })
	return t('accountOverview.kilometers', { count: (meters / 1_000).toLocaleString(locale.value === 'zh' ? 'zh-CN' : 'en-US', { maximumFractionDigits: 2 }) })
}

function formatDamage(rawDamage: number) {
	const damage = rawDamage / 10
	return t('accountOverview.damagePoints', { count: damage.toLocaleString(locale.value === 'zh' ? 'zh-CN' : 'en-US', { maximumFractionDigits: 1 }) })
}

function formatDuration(ticks: number) {
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

const infoItems = computed(() => [
	{ label: t('playerCard.playerId'), value: props.username || t('common.unknown') },
	{ label: t('playerCard.uid'), value: props.qq || t('playerCard.private') },
	{ label: t('accountOverview.playtime'), value: playtimeText.value },
	{ label: t('playerCard.lastOnline'), value: lastLoginText.value },
	{ label: t('playerCard.accountStatus'), value: props.banned ? t('playerCard.frozen') : t('playerCard.normal') },
])
</script>

<template>
	<article class="player-info">
		<header class="profile-header">
			<img
				:src="avatar"
				:alt="t('playerCard.avatarAlt')"
				class="avatar"
				crossorigin="anonymous"
			/>
			<div class="profile-title">
				<h2>{{ username }}</h2>
				<span class="status-pill" :class="statusClass">{{ statusText }}</span>
			</div>
		</header>

		<section class="content-grid">
			<div class="preview-panel">
				<div class="preview-frame">
					<ArtCardForQueryUsage :scale="0.42" :username="username" />
				</div>
			</div>

			<div class="detail-panel">
				<div class="section-heading">
					<h3>{{ t('playerCard.info') }}</h3>
					<p>{{ t('playerCard.infoDescription') }}</p>
				</div>

				<div class="info-grid">
					<div v-for="item in infoItems" :key="item.label" class="info-item">
						<span>{{ item.label }}</span>
						<strong>{{ item.value }}</strong>
					</div>
				</div>

				<div class="section-heading game-statistics-heading">
					<h3>{{ t('playerCard.statistics') }}</h3>
				</div>

				<div class="info-grid">
					<div v-for="item in gameStatisticItems" :key="item.label" class="info-item">
						<span>{{ item.label }}</span>
						<strong>{{ item.value }}</strong>
					</div>
				</div>
			</div>
		</section>
	</article>
</template>

<style scoped>
.player-info {
	width: 100%;
	display: grid;
	gap: 1rem;
	color: var(--text-main);
	border: 1px solid var(--split);
	border-radius: 8px;
	background: var(--background);
	padding: 1rem;
	box-sizing: border-box;
}

.profile-header {
	display: flex;
	align-items: center;
	gap: 0.95rem;
	border-bottom: 1px solid var(--split);
	padding-bottom: 1rem;
	min-width: 0;
}

.avatar {
	width: 64px;
	height: 64px;
	border-radius: 8px;
	border: 1px solid var(--split);
	background: var(--background-secondary);
	object-fit: cover;
	flex: 0 0 auto;
}

.profile-title {
	min-width: 0;
	display: grid;
	gap: 0.28rem;
}

.profile-title h2 {
	margin: 0;
	color: var(--title-color);
	font-size: clamp(1.4rem, 2vw, 2rem);
	line-height: 1.15;
	overflow-wrap: anywhere;
}

.status-pill {
	width: fit-content;
	border: 1px solid var(--split);
	border-radius: 999px;
	padding: 0.25rem 0.58rem;
	font-size: 0.8rem;
	font-weight: 800;
	line-height: 1;
}

.status-online {
	border-color: color-mix(in srgb, var(--success) 54%, var(--split));
	color: var(--success);
}

.status-banned {
	border-color: color-mix(in srgb, var(--error) 58%, var(--split));
	color: var(--error);
}

.status-offline {
	color: var(--text-secondary);
}

.content-grid {
	display: grid;
	grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
	gap: 1rem;
	align-items: stretch;
}

.preview-panel,
.detail-panel {
	border: 1px solid var(--split);
	border-radius: 8px;
	background: var(--background);
	min-width: 0;
}

.preview-panel {
	display: flex;
	justify-content: center;
	align-items: flex-start;
	padding: 1rem;
	overflow: hidden;
}

.preview-frame {
	width: 294px;
	height: 420px;
	max-width: 100%;
	overflow: hidden;
	border-radius: 6px;
	background: var(--background-secondary);
}

.detail-panel {
	padding: 1rem;
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.section-heading h3 {
	margin: 0 0 0.28rem;
	color: var(--title-color);
	font-size: 1.05rem;
	line-height: 1.2;
}

.section-heading p {
	margin: 0;
	color: var(--text-secondary);
	font-size: 0.9rem;
	line-height: 1.45;
}

.info-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.65rem;
}

.info-item {
	border: 1px solid var(--split);
	border-radius: 6px;
	padding: 0.78rem 0.85rem;
	display: grid;
	gap: 0.22rem;
	min-width: 0;
}

.info-item span {
	color: var(--text-secondary);
	font-size: 0.8rem;
}

.info-item strong {
	color: var(--text-main);
	font-size: 0.98rem;
	line-height: 1.35;
	overflow-wrap: anywhere;
}

@media (max-width: 760px) {
	.content-grid {
		grid-template-columns: 1fr;
	}

	.preview-frame {
		width: 252px;
		height: 360px;
	}

	.preview-frame :deep(.wrapper) {
		transform: scale(0.36) !important;
	}
}

@media (max-width: 520px) {
	.profile-header {
		align-items: flex-start;
	}

	.avatar {
		width: 56px;
		height: 56px;
	}

	.info-grid {
		grid-template-columns: 1fr;
	}
}
</style>
