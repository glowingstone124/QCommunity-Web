<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
	quota: { type: Object, default: null },
	usage: { type: Object, default: null },
	recentUsage: { type: Array, default: () => [] },
	byChannel: { type: Object, default: () => ({}) },
	isLoading: { type: Boolean, default: false },
	feedback: { type: String, default: '' },
	feedbackType: { type: String, default: '' },
	kotshiQueryEnabled: { type: Boolean, default: true },
	kotshiQuerySettingLoaded: { type: Boolean, default: false },
	kotshiQuerySettingSaving: { type: Boolean, default: false },
	qbotActiveResponseEnabled: { type: Boolean, default: true },
	qbotActiveResponseSettingLoaded: { type: Boolean, default: false },
	qbotActiveResponseSettingSaving: { type: Boolean, default: false },
})

const emit = defineEmits([
	'refresh',
	'update:kotshiQueryEnabled',
	'update:qbotActiveResponseEnabled',
])

const { t, locale } = useI18n()

const selectedChannelFilter = ref('all')
const selectedStatusFilter = ref('all')

const limit = computed(() => Number(props.quota?.limit || 0))
const remaining = computed(() => Number(props.quota?.remaining || 0))
const used = computed(() => Number(props.quota?.used || 0))
const paidCredits = computed(() => Number(props.quota?.paid_credits || 0))

const remainingPercent = computed(() => {
	if (!limit.value) return 0
	return Math.min(Math.max((remaining.value / limit.value) * 100, 0), 100)
})

const usedPercent = computed(() => {
	if (!limit.value) return 0
	return Math.min(Math.max((used.value / limit.value) * 100, 0), 100)
})

const totalRequests = computed(() => Number(props.usage?.requests || 0))
const completedRequests = computed(() => Number(props.usage?.completed || 0))
const failedRequests = computed(() => Number(props.usage?.failed || 0))
const totalTokens = computed(() => Number(props.usage?.total_tokens || 0))
const promptTokens = computed(() => Number(props.usage?.prompt_tokens || 0))
const completionTokens = computed(() => Number(props.usage?.completion_tokens || 0))

const successRate = computed(() => {
	if (!totalRequests.value) return 100
	return Math.round((completedRequests.value / totalRequests.value) * 1000) / 10
})

const avgTokensPerRequest = computed(() => {
	if (!totalRequests.value) return 0
	return Math.round(totalTokens.value / totalRequests.value)
})

const channelStats = computed(() => {
	const result = {
		qq: { requests: 0, completed: 0, failed: 0, totalTokens: 0 },
		web: { requests: 0, completed: 0, failed: 0, totalTokens: 0 },
		minecraft: { requests: 0, completed: 0, failed: 0, totalTokens: 0 },
	}
	if (props.byChannel && Object.keys(props.byChannel).length > 0) {
		for (const [key, val] of Object.entries(props.byChannel)) {
			const channelKey = ['qq', 'web', 'minecraft'].includes(key) ? key : 'other'
			if (!result[channelKey]) {
				result[channelKey] = { requests: 0, completed: 0, failed: 0, totalTokens: 0 }
			}
			result[channelKey].requests += Number(val?.requests || 0)
			result[channelKey].completed += Number(val?.completed || 0)
			result[channelKey].failed += Number(val?.failed || 0)
			result[channelKey].totalTokens += Number(val?.total_tokens || 0)
		}
	} else if (Array.isArray(props.recentUsage)) {
		for (const record of props.recentUsage) {
			const channelKey = ['qq', 'web', 'minecraft'].includes(record?.source) ? record.source : 'other'
			if (!result[channelKey]) {
				result[channelKey] = { requests: 0, completed: 0, failed: 0, totalTokens: 0 }
			}
			result[channelKey].requests++
			if (record?.status === 'completed') result[channelKey].completed++
			else if (record?.status === 'failed' || record?.status === 'rejected') result[channelKey].failed++
			result[channelKey].totalTokens += Number(record?.total_tokens || 0)
		}
	}
	return result
})

function channelShare(channelKey) {
	if (!totalRequests.value) return 0
	const req = channelStats.value[channelKey]?.requests || 0
	return Math.round((req / totalRequests.value) * 100)
}

const filteredRecentUsage = computed(() => {
	return props.recentUsage.filter((item) => {
		if (selectedChannelFilter.value !== 'all') {
			const ch = String(item.source || '').toLowerCase()
			if (selectedChannelFilter.value === 'other') {
				if (['qq', 'web', 'minecraft'].includes(ch)) return false
			} else if (ch !== selectedChannelFilter.value) {
				return false
			}
		}
		if (selectedStatusFilter.value !== 'all') {
			const st = String(item.status || '').toLowerCase()
			if (selectedStatusFilter.value === 'completed' && st !== 'completed') return false
			if (selectedStatusFilter.value === 'failed' && st !== 'failed' && st !== 'rejected') return false
		}
		return true
	})
})

function number(value) {
	return Number(value || 0).toLocaleString(locale.value === 'zh' ? 'zh-CN' : 'en-US')
}

function formatTime(timestamp) {
	const value = Number(timestamp || 0)
	if (!value) return t('kotshiPage.unknownTime')
	return new Date(value < 100000000000 ? value * 1000 : value).toLocaleString(
		locale.value === 'zh' ? 'zh-CN' : 'en-US',
	)
}

function formatRelativeTime(timestamp) {
	const value = Number(timestamp || 0)
	if (!value) return ''
	const dateMs = value < 100000000000 ? value * 1000 : value
	const diffSec = Math.floor((Date.now() - dateMs) / 1000)
	if (diffSec < 60) return locale.value === 'zh' ? '刚刚' : 'just now'
	if (diffSec < 3600) {
		const mins = Math.floor(diffSec / 60)
		return locale.value === 'zh' ? `${mins} 分钟前` : `${mins}m ago`
	}
	if (diffSec < 86400) {
		const hours = Math.floor(diffSec / 3600)
		return locale.value === 'zh' ? `${hours} 小时前` : `${hours}h ago`
	}
	return ''
}

function formatLatency(record) {
	if (!record.completed_at || !record.created_at) return ''
	const delta = Number(record.completed_at) - Number(record.created_at)
	if (delta <= 0) return ''
	if (delta < 1000) return `${delta}ms`
	return `${(delta / 1000).toFixed(1)}s`
}

function statusLabel(status) {
	return t(`kotshiPage.status.${String(status || 'unknown').toLowerCase()}`)
}

function sourceLabel(source) {
	const channel = String(source || '').toLowerCase()
	return t(`kotshiPage.channels.${['web', 'qq', 'minecraft'].includes(channel) ? channel : 'other'}`)
}
</script>

<template>
	<section class="panel kotshi-panel">
		<!-- Header -->
		<header class="panel-header">
			<div>
				<h2 class="panel-title">{{ t('kotshiPage.title') }}</h2>
				<p class="panel-sub">{{ t('kotshiPage.description') }}</p>
			</div>
			<button class="secondary-button" type="button" :disabled="isLoading" @click="emit('refresh')">
				{{ isLoading ? t('common.refreshing') : t('kotshiPage.refresh') }}
			</button>
		</header>

		<!-- Feedback message -->
		<p v-if="feedback" class="feedback" :class="feedbackType" role="status">{{ feedback }}</p>

		<!-- Loading State -->
		<div v-if="isLoading && !quota" class="loading-state">{{ t('kotshiPage.loading') }}</div>

		<template v-else>
			<!-- 1. Services & Feature Toggles Section -->
			<section class="controls-card">
				<header class="controls-header">
					<div>
						<h3 class="controls-title">{{ t('kotshiPage.controlsTitle') }}</h3>
						<p class="controls-sub">{{ t('kotshiPage.controlsDescription') }}</p>
					</div>
				</header>

				<div class="controls-grid">
					<!-- QBot Active Response Switch Card -->
					<div class="control-tile" :class="{ 'is-disabled': !props.qbotActiveResponseEnabled }">
						<div class="control-tile-head">
							<div class="control-tile-info">
								<span class="control-badge" :class="props.qbotActiveResponseEnabled ? 'badge-active' : 'badge-inactive'">
									{{ props.qbotActiveResponseEnabled ? t('kotshiPage.qbotActiveResponseStatusEnabled') : t('kotshiPage.qbotActiveResponseStatusDisabled') }}
								</span>
								<h4 class="control-name">{{ t('kotshiPage.qbotActiveResponse') }}</h4>
							</div>
							<label class="switch-toggle" :aria-label="t('kotshiPage.qbotActiveResponse')">
								<input
									type="checkbox"
									:checked="props.qbotActiveResponseEnabled"
									:disabled="!props.qbotActiveResponseSettingLoaded || props.qbotActiveResponseSettingSaving"
									@change="emit('update:qbotActiveResponseEnabled', $event.target.checked)"
								/>
								<span class="switch-slider"></span>
							</label>
						</div>
						<p class="control-desc">{{ t('kotshiPage.qbotActiveResponseDesc') }}</p>
						<span v-if="props.qbotActiveResponseSettingSaving" class="saving-hint">{{ t('kotshiPage.toggleSaving') }}</span>
					</div>

					<!-- Kotshi Profile Query Switch Card -->
					<div class="control-tile" :class="{ 'is-disabled': !props.kotshiQueryEnabled }">
						<div class="control-tile-head">
							<div class="control-tile-info">
								<span class="control-badge" :class="props.kotshiQueryEnabled ? 'badge-active' : 'badge-inactive'">
									{{ props.kotshiQueryEnabled ? t('kotshiPage.profileQueryStatusEnabled') : t('kotshiPage.profileQueryStatusDisabled') }}
								</span>
								<h4 class="control-name">{{ t('kotshiPage.profileQuery') }}</h4>
							</div>
							<label class="switch-toggle" :aria-label="t('kotshiPage.profileQuery')">
								<input
									type="checkbox"
									:checked="props.kotshiQueryEnabled"
									:disabled="!props.kotshiQuerySettingLoaded || props.kotshiQuerySettingSaving"
									@change="emit('update:kotshiQueryEnabled', $event.target.checked)"
								/>
								<span class="switch-slider"></span>
							</label>
						</div>
						<p class="control-desc">{{ t('kotshiPage.profileQueryDesc') }}</p>
						<span v-if="props.kotshiQuerySettingSaving" class="saving-hint">{{ t('kotshiPage.toggleSaving') }}</span>
					</div>
				</div>
			</section>

			<!-- 2. Quota & Billing Summary Grid -->
			<div class="summary-grid">
				<!-- Weekly Free Quota Card -->
				<section class="summary-card quota-card">
					<div class="card-head-row">
						<h3 class="summary-card-title">{{ t('kotshiPage.quotaTitle') }}</h3>
						<span class="quota-pill">{{ t('kotshiPage.usageRatio', { ratio: usedPercent.toFixed(1) }) }}</span>
					</div>
					<div class="quota-value">
						<strong>{{ number(remaining) }}</strong>
						<span>/ {{ number(limit) }}</span>
					</div>
					<div class="quota-track" :title="`剩余: ${number(remaining)} (${remainingPercent.toFixed(1)}%)`">
						<span :style="{ width: `${remainingPercent}%` }"></span>
					</div>
					<div class="quota-meta-split">
						<span>{{ t('kotshiPage.usedCredits') }}: <strong>{{ number(used) }}</strong></span>
						<span>{{ t('kotshiPage.weeklyQuota') }}: <strong>{{ number(limit) }}</strong></span>
					</div>
					<p>{{ t('kotshiPage.quotaDescription') }}</p>
					<div class="card-footer-info">
						<small>{{ t('kotshiPage.resetAt', { time: formatTime(quota?.reset_at) }) }}</small>
						<small class="schedule-text">({{ t('kotshiPage.resetSchedule') }})</small>
					</div>
				</section>

				<!-- Paid Credits Card -->
				<section class="summary-card paid-card">
					<div class="card-head-row">
						<h3 class="summary-card-title">{{ t('kotshiPage.paidCredits') }}</h3>
						<span class="paid-pill">Credits</span>
					</div>
					<div class="quota-value">
						<strong>{{ number(paidCredits) }}</strong>
					</div>
					<p>{{ t('kotshiPage.paidDescription') }}</p>
					<div class="rules-box">
						<strong>{{ t('kotshiPage.billingRulesTitle') }}</strong>
						<span>{{ t('kotshiPage.billingRulesDesc') }}</span>
					</div>
					<small class="paid-retention">{{ t('kotshiPage.paidRetention') }}</small>
				</section>
			</div>

			<!-- 3. Usage & Efficiency Overview -->
			<section class="metrics-section">
				<header class="section-head">
					<div>
						<h3>{{ t('kotshiPage.statOverviewTitle') }}</h3>
						<p>{{ t('kotshiPage.statOverviewDesc') }}</p>
					</div>
				</header>

				<div class="metrics-grid">
					<!-- Requests tile -->
					<div class="metric-tile">
						<span class="metric-label">{{ t('kotshiPage.usageTitle') }}</span>
						<strong class="metric-number">{{ number(totalRequests) }}</strong>
						<span class="metric-sub">
							{{ t('kotshiPage.completed') }} {{ number(completedRequests) }} · {{ t('kotshiPage.failed') }} {{ number(failedRequests) }}
						</span>
					</div>

					<!-- Success rate tile -->
					<div class="metric-tile">
						<span class="metric-label">{{ t('kotshiPage.successRate') }}</span>
						<strong class="metric-number" :class="{ 'is-high': successRate >= 90, 'is-warn': successRate < 90 }">
							{{ successRate }}%
						</strong>
						<div class="metric-bar-track">
							<span class="metric-bar-fill" :style="{ width: `${successRate}%` }"></span>
						</div>
					</div>

					<!-- Total tokens tile -->
					<div class="metric-tile">
						<span class="metric-label">{{ t('kotshiPage.totalTokens') }}</span>
						<strong class="metric-number">{{ number(totalTokens) }}</strong>
						<span class="metric-sub" v-if="promptTokens || completionTokens">
							{{ t('kotshiPage.promptVsCompletion', { prompt: number(promptTokens), completion: number(completionTokens) }) }}
						</span>
						<span class="metric-sub" v-else>{{ t('kotshiPage.tokens') }}</span>
					</div>

					<!-- Avg tokens/req tile -->
					<div class="metric-tile">
						<span class="metric-label">{{ t('kotshiPage.avgTokensPerReq') }}</span>
						<strong class="metric-number">{{ number(avgTokensPerRequest) }}</strong>
						<span class="metric-sub">{{ t('kotshiPage.tokens') }} / req</span>
					</div>
				</div>
			</section>

			<!-- 4. Channel Distribution Section -->
			<section class="channels-section">
				<header class="section-head">
					<div>
						<h3>{{ t('kotshiPage.channelBreakdownTitle') }}</h3>
						<p>{{ t('kotshiPage.channelBreakdownDesc') }}</p>
					</div>
				</header>

				<div class="channels-grid">
					<!-- QQ Bot Tile -->
					<div class="channel-card">
						<div class="channel-card-head">
							<span class="channel-icon-pill qq-pill">QQ</span>
							<strong>{{ t('kotshiPage.channels.qq') }}</strong>
							<span class="channel-share">{{ t('kotshiPage.channelShare', { share: channelShare('qq') }) }}</span>
						</div>
						<div class="channel-numbers">
							<span class="channel-reqs">{{ t('kotshiPage.channelRequests', { count: number(channelStats.qq.requests) }) }}</span>
							<span class="channel-tokens">{{ number(channelStats.qq.totalTokens) }} {{ t('kotshiPage.tokens') }}</span>
						</div>
						<div class="channel-track"><span class="qq-fill" :style="{ width: `${channelShare('qq')}%` }"></span></div>
					</div>

					<!-- Kotshi Web Tile -->
					<div class="channel-card">
						<div class="channel-card-head">
							<span class="channel-icon-pill web-pill">Web</span>
							<strong>{{ t('kotshiPage.channels.web') }}</strong>
							<span class="channel-share">{{ t('kotshiPage.channelShare', { share: channelShare('web') }) }}</span>
						</div>
						<div class="channel-numbers">
							<span class="channel-reqs">{{ t('kotshiPage.channelRequests', { count: number(channelStats.web.requests) }) }}</span>
							<span class="channel-tokens">{{ number(channelStats.web.totalTokens) }} {{ t('kotshiPage.tokens') }}</span>
						</div>
						<div class="channel-track"><span class="web-fill" :style="{ width: `${channelShare('web')}%` }"></span></div>
					</div>

					<!-- Minecraft Tile -->
					<div class="channel-card">
						<div class="channel-card-head">
							<span class="channel-icon-pill mc-pill">MC</span>
							<strong>{{ t('kotshiPage.channels.minecraft') }}</strong>
							<span class="channel-share">{{ t('kotshiPage.channelShare', { share: channelShare('minecraft') }) }}</span>
						</div>
						<div class="channel-numbers">
							<span class="channel-reqs">{{ t('kotshiPage.channelRequests', { count: number(channelStats.minecraft.requests) }) }}</span>
							<span class="channel-tokens">{{ number(channelStats.minecraft.totalTokens) }} {{ t('kotshiPage.tokens') }}</span>
						</div>
						<div class="channel-track"><span class="mc-fill" :style="{ width: `${channelShare('minecraft')}%` }"></span></div>
					</div>
				</div>
			</section>

			<!-- 5. Usage Records with Granular Filters -->
			<section class="usage-section">
				<header class="section-head">
					<div>
						<h3>{{ t('kotshiPage.detailTitle') }}</h3>
						<p>{{ t('kotshiPage.detailDescription') }}</p>
					</div>

					<!-- Filters bar -->
					<div class="filters-row">
						<!-- Channel Filter Pills -->
						<div class="filter-pills" role="group" :aria-label="t('kotshiPage.channelBreakdownTitle')">
							<button
								type="button"
								class="filter-pill"
								:class="{ 'is-active': selectedChannelFilter === 'all' }"
								@click="selectedChannelFilter = 'all'"
							>
								{{ t('kotshiPage.filterAllChannels') }}
							</button>
							<button
								type="button"
								class="filter-pill"
								:class="{ 'is-active': selectedChannelFilter === 'qq' }"
								@click="selectedChannelFilter = 'qq'"
							>
								QQ
							</button>
							<button
								type="button"
								class="filter-pill"
								:class="{ 'is-active': selectedChannelFilter === 'web' }"
								@click="selectedChannelFilter = 'web'"
							>
								Web
							</button>
							<button
								type="button"
								class="filter-pill"
								:class="{ 'is-active': selectedChannelFilter === 'minecraft' }"
								@click="selectedChannelFilter = 'minecraft'"
							>
								MC
							</button>
						</div>

						<!-- Status Filter Pills -->
						<div class="filter-pills" role="group" :aria-label="t('kotshiPage.completed')">
							<button
								type="button"
								class="filter-pill"
								:class="{ 'is-active': selectedStatusFilter === 'all' }"
								@click="selectedStatusFilter = 'all'"
							>
								{{ t('kotshiPage.filterAllStatuses') }}
							</button>
							<button
								type="button"
								class="filter-pill"
								:class="{ 'is-active': selectedStatusFilter === 'completed' }"
								@click="selectedStatusFilter = 'completed'"
							>
								{{ t('kotshiPage.filterSuccessOnly') }}
							</button>
							<button
								type="button"
								class="filter-pill"
								:class="{ 'is-active': selectedStatusFilter === 'failed' }"
								@click="selectedStatusFilter = 'failed'"
							>
								{{ t('kotshiPage.filterFailedOnly') }}
							</button>
						</div>
					</div>
				</header>

				<!-- Records List -->
				<div v-if="filteredRecentUsage.length" class="usage-list">
					<div
						v-for="(record, index) in filteredRecentUsage"
						:key="`${record.created_at}-${index}`"
						class="usage-row"
					>
						<span class="usage-index">{{ String(index + 1).padStart(2, '0') }}</span>

						<div class="usage-channel-col">
							<span
								class="channel-badge"
								:class="`is-${String(record.source || 'other').toLowerCase()}`"
							>
								{{ sourceLabel(record.source) }}
							</span>
						</div>

						<div class="usage-copy">
							<div class="usage-time-row">
								<span class="usage-time-abs">{{ formatTime(record.created_at) }}</span>
								<span v-if="formatRelativeTime(record.created_at)" class="usage-time-rel">
									({{ formatRelativeTime(record.created_at) }})
								</span>
								<span v-if="formatLatency(record)" class="usage-latency">
									⚡ {{ formatLatency(record) }}
								</span>
							</div>
							<div v-if="record.error_message" class="usage-err-tip" :title="record.error_message">
								⚠️ {{ record.error_message }}
							</div>
						</div>

						<span class="usage-status" :class="`is-${String(record.status || '').toLowerCase()}`">
							{{ statusLabel(record.status) }}
						</span>

						<div class="usage-tokens-col">
							<strong>{{ number(record.total_tokens) }}</strong>
							<span>{{ t('kotshiPage.tokens') }}</span>
							<span
								v-if="record.prompt_tokens || record.completion_tokens"
								class="usage-tokens-sub"
								:title="`${t('kotshiPage.promptTokens')}: ${number(record.prompt_tokens)}, ${t('kotshiPage.completionTokens')}: ${number(record.completion_tokens)}`"
							>
								{{ number(record.prompt_tokens) }} / {{ number(record.completion_tokens) }}
							</span>
						</div>
					</div>
				</div>

				<div v-else class="empty-state">
					<strong>{{ recentUsage.length ? t('kotshiPage.emptyFiltered') : t('kotshiPage.noUsage') }}</strong>
					<span>{{ recentUsage.length ? t('kotshiPage.emptyFilteredDesc') : t('kotshiPage.noUsageDescription') }}</span>
				</div>
			</section>
		</template>
	</section>
</template>

<style scoped>
.panel {
	display: flex;
	flex-direction: column;
	gap: 1.35rem;
	min-height: 100%;
	max-width: 1120px;
	width: 100%;
	margin: 0 auto;
	padding: clamp(1rem, 2vw, 1.5rem);
	box-sizing: border-box;
	background: var(--glass-strong);
}

.panel-header,
.section-head,
.controls-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	gap: 1rem;
	padding-bottom: 1.15rem;
	border-bottom: 1px solid var(--border-soft);
}

.panel-title { margin: 0; color: var(--title-color); font-size: clamp(1.35rem, 2vw, 1.65rem); line-height: 1.2; font-weight: 800; }
.panel-sub, .section-head p, .controls-sub { margin: 0.35rem 0 0; color: var(--text-secondary); line-height: 1.5; font-size: 0.9rem; }
.secondary-button { padding: 0.5rem 0.85rem; border: 1px solid var(--border-soft); background: transparent; color: var(--text-main); cursor: pointer; font-weight: 600; white-space: nowrap; transition: all 160ms ease; }
.secondary-button:hover:not(:disabled) { border-color: var(--primary); background: var(--surface-soft); }
.secondary-button:disabled { opacity: 0.46; cursor: not-allowed; }
.feedback { margin: 0; padding: 0.75rem 0.85rem; border-left: 3px solid var(--error); background: color-mix(in srgb, var(--error) 7%, transparent); color: var(--error); font-size: 0.9rem; }
.feedback.success { border-color: var(--success); background: color-mix(in srgb, var(--success) 7%, transparent); color: var(--success); }
.loading-state, .empty-state { padding: 2.5rem 1rem; text-align: center; color: var(--text-secondary); }
.empty-state { display: grid; gap: 0.4rem; border: 1px dashed var(--border-soft); background: var(--surface-soft); }
.empty-state strong { color: var(--text-main); font-size: 0.96rem; }

/* 1. Controls / Switches Section */
.controls-card {
	display: flex;
	flex-direction: column;
	gap: 1.1rem;
	padding: 1.15rem;
	border: 1px solid var(--border-soft);
	background: color-mix(in srgb, var(--surface-soft) 40%, transparent);
}
.controls-header { border-bottom: 1px solid var(--border-soft); padding-bottom: 0.75rem; }
.controls-title { margin: 0; color: var(--title-color); font-size: 1.05rem; font-weight: 700; }
.controls-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 1rem;
}
.control-tile {
	display: flex;
	flex-direction: column;
	gap: 0.65rem;
	padding: 1rem;
	background: var(--surface-soft);
	border: 1px solid var(--border-soft);
	transition: border-color 160ms ease;
}
.control-tile.is-disabled {
	opacity: 0.82;
}
.control-tile-head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 0.75rem;
}
.control-tile-info {
	display: grid;
	gap: 0.35rem;
	min-width: 0;
}
.control-badge {
	align-self: flex-start;
	padding: 0.15rem 0.45rem;
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.02em;
	border-radius: 2px;
}
.badge-active {
	background: color-mix(in srgb, var(--success) 14%, transparent);
	color: var(--success);
	border: 1px solid color-mix(in srgb, var(--success) 35%, transparent);
}
.badge-inactive {
	background: var(--surface-soft);
	color: var(--text-secondary);
	border: 1px solid var(--border-soft);
}
.control-name {
	margin: 0;
	font-size: 1rem;
	font-weight: 700;
	color: var(--text-main);
}
.control-desc {
	margin: 0;
	color: var(--text-secondary);
	font-size: 0.84rem;
	line-height: 1.45;
}
.saving-hint {
	font-size: 0.76rem;
	color: var(--primary);
	font-weight: 600;
}

/* Switch toggle style */
.switch-toggle {
	position: relative;
	display: inline-block;
	width: 44px;
	height: 24px;
	flex-shrink: 0;
	cursor: pointer;
}
.switch-toggle input {
	opacity: 0;
	width: 0;
	height: 0;
}
.switch-slider {
	position: absolute;
	inset: 0;
	background-color: var(--border-soft);
	transition: background-color 180ms ease;
	border-radius: 24px;
}
.switch-slider::before {
	position: absolute;
	content: "";
	height: 18px;
	width: 18px;
	left: 3px;
	bottom: 3px;
	background-color: var(--background);
	transition: transform 180ms ease;
	border-radius: 50%;
}
.switch-toggle input:checked + .switch-slider {
	background-color: var(--primary);
}
.switch-toggle input:checked + .switch-slider::before {
	transform: translateX(20px);
}
.switch-toggle input:disabled + .switch-slider {
	opacity: 0.45;
	cursor: not-allowed;
}

/* 2. Quota & Paid summary */
.summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.summary-card { min-width: 0; padding: 1.15rem; border: 1px solid var(--border-soft); background: var(--surface-soft); display: flex; flex-direction: column; justify-content: space-between; }
.card-head-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.summary-card-title { margin: 0; color: var(--text-main); font-size: 1rem; font-weight: 700; line-height: 1.35; }
.quota-pill, .paid-pill {
	font-size: 0.75rem;
	font-weight: 700;
	padding: 0.15rem 0.5rem;
	background: color-mix(in srgb, var(--primary) 12%, transparent);
	color: var(--primary);
	border: 1px solid color-mix(in srgb, var(--primary) 28%, transparent);
}
.quota-value { display: flex; align-items: baseline; gap: 0.4rem; margin-top: 0.6rem; color: var(--text-main); }
.quota-value strong { font-size: 2.2rem; line-height: 1; font-weight: 800; font-family: var(--font-mono); }
.quota-value span { color: var(--text-secondary); font-size: 1.05rem; }
.quota-track { height: 8px; margin-top: 0.9rem; overflow: hidden; background: var(--background-secondary); border: 1px solid var(--border-soft); }
.quota-track span { display: block; height: 100%; background: var(--primary); transition: width 180ms ease; }
.quota-meta-split { display: flex; justify-content: space-between; margin-top: 0.6rem; font-size: 0.82rem; color: var(--text-secondary); }
.quota-meta-split strong { color: var(--text-main); }
.summary-card p { margin: 0.75rem 0 0; color: var(--text-secondary); font-size: 0.86rem; line-height: 1.45; }
.card-footer-info { margin-top: 0.6rem; }
.card-footer-info small { display: block; color: var(--text-secondary); font-size: 0.8rem; }
.schedule-text { color: var(--text-secondary); opacity: 0.85; margin-top: 0.15rem; }
.rules-box {
	margin-top: 0.75rem;
	padding: 0.55rem 0.75rem;
	background: color-mix(in srgb, var(--text-main) 3%, transparent);
	border-left: 2px solid var(--primary);
	display: grid;
	gap: 0.2rem;
}
.rules-box strong { font-size: 0.8rem; color: var(--text-main); }
.rules-box span { font-size: 0.76rem; color: var(--text-secondary); line-height: 1.4; }
.paid-retention { display: block; margin-top: 0.5rem; color: var(--text-secondary); font-size: 0.8rem; }

/* 3. Metrics Section */
.metrics-section, .channels-section, .usage-section {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.15rem;
	border: 1px solid var(--border-soft);
	background: color-mix(in srgb, var(--surface-soft) 20%, transparent);
}
.section-head { align-items: flex-start; padding-bottom: 0.85rem; }
.section-head h3 { margin: 0; color: var(--title-color); font-size: 1.05rem; font-weight: 700; }
.metrics-grid {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 0.85rem;
}
.metric-tile {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	padding: 0.85rem 0.95rem;
	background: var(--surface-soft);
	border: 1px solid var(--border-soft);
}
.metric-label { font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; }
.metric-number { font-size: 1.55rem; color: var(--text-main); font-family: var(--font-mono); font-weight: 800; line-height: 1.15; }
.metric-number.is-high { color: var(--success); }
.metric-number.is-warn { color: var(--warning); }
.metric-sub { font-size: 0.76rem; color: var(--text-secondary); line-height: 1.35; }
.metric-bar-track { height: 5px; margin-top: 0.2rem; background: var(--background-secondary); border: 1px solid var(--border-soft); overflow: hidden; }
.metric-bar-fill { display: block; height: 100%; background: var(--success); }

/* 4. Channels Section */
.channels-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 0.85rem;
}
.channel-card {
	display: flex;
	flex-direction: column;
	gap: 0.55rem;
	padding: 0.9rem 1rem;
	background: var(--surface-soft);
	border: 1px solid var(--border-soft);
}
.channel-card-head {
	display: flex;
	align-items: center;
	gap: 0.6rem;
}
.channel-icon-pill {
	font-size: 0.7rem;
	font-weight: 800;
	padding: 0.1rem 0.4rem;
	border-radius: 2px;
	letter-spacing: 0.04em;
}
.qq-pill { background: #0099ff; color: #ffffff; }
.web-pill { background: #10b981; color: #ffffff; }
.mc-pill { background: #8b5cf6; color: #ffffff; }
.channel-card-head strong { font-size: 0.92rem; color: var(--text-main); }
.channel-share { margin-left: auto; font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); }
.channel-numbers {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	font-size: 0.8rem;
}
.channel-reqs { color: var(--text-main); font-weight: 600; }
.channel-tokens { color: var(--text-secondary); font-family: var(--font-mono); font-size: 0.78rem; }
.channel-track { height: 5px; background: var(--background-secondary); border: 1px solid var(--border-soft); overflow: hidden; }
.qq-fill { display: block; height: 100%; background: #0099ff; }
.web-fill { display: block; height: 100%; background: #10b981; }
.mc-fill { display: block; height: 100%; background: #8b5cf6; }

/* 5. Filters and Usage list */
.filters-row {
	display: flex;
	flex-wrap: wrap;
	gap: 0.65rem;
	align-items: center;
}
.filter-pills {
	display: inline-flex;
	padding: 2px;
	border: 1px solid var(--border-soft);
	background: var(--background-secondary);
}
.filter-pill {
	padding: 0.35rem 0.65rem;
	border: none;
	background: transparent;
	color: var(--text-secondary);
	font-size: 0.78rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 140ms ease;
}
.filter-pill:hover { color: var(--text-main); }
.filter-pill.is-active {
	background: var(--text-main);
	color: var(--background);
}
.usage-list { display: grid; gap: 0.5rem; }
.usage-row {
	display: grid;
	grid-template-columns: 32px 90px minmax(0, 1fr) 75px auto;
	gap: 0.85rem;
	align-items: center;
	min-height: 56px;
	padding: 0.55rem 0.75rem;
	background: var(--surface-soft);
	border: 1px solid var(--border-soft);
	transition: border-color 140ms ease;
}
.usage-row:hover { border-color: var(--primary); }
.usage-index { color: var(--text-secondary); font-family: var(--font-mono); font-size: 0.78rem; }
.usage-channel-col { display: flex; align-items: center; }
.channel-badge {
	font-size: 0.74rem;
	font-weight: 700;
	padding: 0.15rem 0.45rem;
	border-radius: 2px;
	white-space: nowrap;
}
.channel-badge.is-qq { background: color-mix(in srgb, #0099ff 14%, transparent); color: #0099ff; border: 1px solid color-mix(in srgb, #0099ff 35%, transparent); }
.channel-badge.is-web { background: color-mix(in srgb, #10b981 14%, transparent); color: #10b981; border: 1px solid color-mix(in srgb, #10b981 35%, transparent); }
.channel-badge.is-minecraft { background: color-mix(in srgb, #8b5cf6 14%, transparent); color: #8b5cf6; border: 1px solid color-mix(in srgb, #8b5cf6 35%, transparent); }
.channel-badge.is-other { background: var(--surface-soft); color: var(--text-secondary); border: 1px solid var(--border-soft); }

.usage-copy { display: grid; gap: 0.2rem; min-width: 0; }
.usage-time-row { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.45rem; font-size: 0.82rem; }
.usage-time-abs { color: var(--text-main); font-weight: 600; }
.usage-time-rel { color: var(--text-secondary); font-size: 0.76rem; }
.usage-latency { color: var(--primary); font-size: 0.74rem; font-family: var(--font-mono); font-weight: 700; }
.usage-err-tip { font-size: 0.74rem; color: var(--error); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 420px; }

.usage-status { font-size: 0.78rem; font-weight: 700; text-align: center; padding: 0.15rem 0.35rem; }
.usage-status.is-completed { color: var(--success); }
.usage-status.is-failed, .usage-status.is-rejected { color: var(--error); }
.usage-status.is-started { color: var(--primary); }

.usage-tokens-col {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 0.1rem;
	font-family: var(--font-mono);
	min-width: 80px;
}
.usage-tokens-col strong { color: var(--text-main); font-size: 0.92rem; }
.usage-tokens-col span { color: var(--text-secondary); font-size: 0.72rem; }
.usage-tokens-sub { opacity: 0.8; font-size: 0.68rem !important; }

@media (max-width: 900px) {
	.metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	.channels-grid { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
	.panel { padding: 1rem; }
	.panel-header, .section-head, .controls-header { align-items: flex-start; flex-direction: column; }
	.secondary-button { align-self: stretch; }
	.controls-grid { grid-template-columns: 1fr; }
	.summary-grid { grid-template-columns: 1fr; }
	.metrics-grid { grid-template-columns: 1fr; }
	.filters-row { width: 100%; justify-content: flex-start; }
	.usage-row {
		grid-template-columns: 24px minmax(0, 1fr) auto;
		gap: 0.6rem;
	}
	.usage-channel-col { grid-column: 2; }
	.usage-copy { grid-column: 2 / -1; }
	.usage-status { grid-column: 3; grid-row: 1; }
	.usage-tokens-col { grid-column: 2 / -1; align-items: flex-start; flex-direction: row; gap: 0.4rem; }
}
</style>