<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
	quota: { type: Object, default: null },
	usage: { type: Object, default: null },
	recentUsage: { type: Array, default: () => [] },
	isLoading: { type: Boolean, default: false },
	feedback: { type: String, default: '' },
	feedbackType: { type: String, default: '' },
})

const emit = defineEmits(['refresh'])
const { t, locale } = useI18n()

const remainingPercent = computed(() => {
	if (!props.quota?.limit) return 0
	return Math.min(Math.max((Number(props.quota.remaining || 0) / Number(props.quota.limit)) * 100, 0), 100)
})

function number(value) {
	return Number(value || 0).toLocaleString(locale.value === 'zh' ? 'zh-CN' : 'en-US')
}

function formatTime(timestamp) {
	const value = Number(timestamp || 0)
	if (!value) return t('kotshiPage.unknownTime')
	return new Date(value < 100000000000 ? value * 1000 : value).toLocaleString(locale.value === 'zh' ? 'zh-CN' : 'en-US')
}

function statusLabel(status) {
	return t(`kotshiPage.status.${String(status || 'unknown').toLowerCase()}`)
}
</script>

<template>
	<section class="panel kotshi-panel">
		<header class="panel-header">
			<div>
				<h2 class="panel-title">{{ t('kotshiPage.title') }}</h2>
				<p class="panel-sub">{{ t('kotshiPage.description') }}</p>
			</div>
			<button class="secondary-button" type="button" :disabled="isLoading" @click="emit('refresh')">
				{{ isLoading ? t('common.refreshing') : t('kotshiPage.refresh') }}
			</button>
		</header>

		<p v-if="feedback" class="feedback" :class="feedbackType" role="status">{{ feedback }}</p>
		<div v-if="isLoading && !quota" class="loading-state">{{ t('kotshiPage.loading') }}</div>
		<template v-else>
			<div class="summary-grid">
				<section class="summary-card quota-card">
					<div class="card-kicker">{{ t('kotshiPage.quotaTitle') }}</div>
					<div class="quota-value">
						<strong>{{ number(quota?.remaining) }}</strong>
						<span>/ {{ number(quota?.limit) }}</span>
					</div>
					<div class="quota-track"><span :style="{ width: `${remainingPercent}%` }"></span></div>
					<p>{{ t('kotshiPage.quotaDescription') }}</p>
					<small>{{ t('kotshiPage.resetAt', { time: formatTime(quota?.reset_at) }) }}</small>
				</section>

				<section class="summary-card">
					<div class="card-kicker">{{ t('kotshiPage.usageTitle') }}</div>
					<div class="usage-big">{{ number(usage?.requests) }}</div>
					<p>{{ t('kotshiPage.usageDescription') }}</p>
					<div class="usage-split">
						<span>{{ t('kotshiPage.completed') }} <strong>{{ number(usage?.completed) }}</strong></span>
						<span>{{ t('kotshiPage.failed') }} <strong>{{ number(usage?.failed) }}</strong></span>
					</div>
				</section>
			</div>

			<section class="usage-section">
				<header class="section-head">
					<div>
						<h3>{{ t('kotshiPage.detailTitle') }}</h3>
						<p>{{ t('kotshiPage.detailDescription') }}</p>
					</div>
					<div class="token-total">
						<span>{{ t('kotshiPage.totalTokens') }}</span>
						<strong>{{ number(usage?.total_tokens) }}</strong>
					</div>
				</header>

				<div v-if="recentUsage.length" class="usage-list">
					<div v-for="(record, index) in recentUsage" :key="`${record.created_at}-${index}`" class="usage-row">
						<span class="usage-index">{{ String(index + 1).padStart(2, '0') }}</span>
						<div class="usage-copy">
							<strong>{{ record.model || 'Kotshi' }}</strong>
							<span>{{ formatTime(record.created_at) }}</span>
						</div>
						<span class="usage-status" :class="`is-${String(record.status || '').toLowerCase()}`">{{ statusLabel(record.status) }}</span>
						<span class="usage-tokens">{{ number(record.total_tokens) }} {{ t('kotshiPage.tokens') }}</span>
					</div>
				</div>
				<div v-else class="empty-state">
					<strong>{{ t('kotshiPage.noUsage') }}</strong>
					<span>{{ t('kotshiPage.noUsageDescription') }}</span>
				</div>
			</section>
		</template>
	</section>
</template>

<style scoped>
.panel {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
	min-height: 100%;
	max-width: 1120px;
	width: 100%;
	margin: 0 auto;
	padding: clamp(1rem, 2vw, 1.5rem);
	box-sizing: border-box;
	background: var(--glass-strong);
}

.panel-header,
.section-head {
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	gap: 1rem;
	padding-bottom: 1.15rem;
	border-bottom: 1px solid var(--border-soft);
}

.panel-title { margin: 0; color: var(--title-color); font-size: clamp(1.35rem, 2vw, 1.65rem); line-height: 1.2; }
.panel-sub, .section-head p { margin: 0.35rem 0 0; color: var(--text-secondary); line-height: 1.5; }
.secondary-button { padding: 0.5rem 0.75rem; border: 1px solid var(--border-soft); background: transparent; color: var(--text-main); cursor: pointer; font-weight: 600; white-space: nowrap; }
.secondary-button:hover:not(:disabled) { border-color: var(--primary); background: var(--surface-soft); }
.secondary-button:disabled { opacity: 0.46; cursor: not-allowed; }
.feedback { margin: 0; padding: 0.7rem 0.75rem; border-left: 3px solid var(--error); background: color-mix(in srgb, var(--error) 7%, transparent); color: var(--error); }
.feedback.success { border-color: var(--success); background: color-mix(in srgb, var(--success) 7%, transparent); color: var(--success); }
.loading-state, .empty-state { padding: 2.5rem 1rem; text-align: center; color: var(--text-secondary); }
.empty-state { display: grid; gap: 0.35rem; border: 1px dashed var(--border-soft); }
.empty-state strong { color: var(--text-main); }

.summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.summary-card { min-width: 0; padding: 1rem; border: 1px solid var(--border-soft); background: var(--surface-soft); }
.card-kicker { color: var(--text-secondary); font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
.quota-value { display: flex; align-items: baseline; gap: 0.35rem; margin-top: 0.6rem; color: var(--text-main); }
.quota-value strong, .usage-big { font-size: 2rem; line-height: 1; }
.quota-value span { color: var(--text-secondary); }
.quota-track { height: 7px; margin-top: 1rem; overflow: hidden; background: var(--background-secondary); border: 1px solid var(--border-soft); }
.quota-track span { display: block; height: 100%; background: var(--primary); transition: width 180ms ease; }
.summary-card p { margin: 0.8rem 0 0; color: var(--text-secondary); font-size: 0.88rem; line-height: 1.45; }
.summary-card small { display: block; margin-top: 0.45rem; color: var(--text-secondary); }
.usage-big { margin-top: 0.7rem; color: var(--text-main); font-weight: 700; }
.usage-split { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 0.9rem; color: var(--text-secondary); font-size: 0.84rem; }
.usage-split strong { color: var(--text-main); }

.usage-section { display: flex; flex-direction: column; gap: 1rem; padding: 1rem; border: 1px solid var(--border-soft); }
.section-head { align-items: flex-start; padding-bottom: 0.9rem; }
.section-head h3 { margin: 0; color: var(--title-color); font-size: 1rem; }
.section-head p { font-size: 0.86rem; }
.token-total { display: grid; gap: 0.2rem; flex: 0 0 auto; text-align: right; color: var(--text-secondary); font-size: 0.82rem; }
.token-total strong { color: var(--text-main); font-size: 1rem; }
.usage-list { display: grid; gap: 0.5rem; }
.usage-row { display: grid; grid-template-columns: 32px minmax(0, 1fr) auto auto; gap: 0.7rem; align-items: center; min-height: 55px; padding: 0.45rem 0.55rem; background: var(--surface-soft); border: 1px solid var(--border-soft); }
.usage-index { color: var(--text-secondary); font-family: var(--font-mono); font-size: 0.78rem; }
.usage-copy { display: grid; gap: 0.2rem; min-width: 0; }
.usage-copy strong { overflow: hidden; color: var(--text-main); font-size: 0.9rem; text-overflow: ellipsis; white-space: nowrap; }
.usage-copy span, .usage-tokens { color: var(--text-secondary); font-size: 0.78rem; }
.usage-status { min-width: 3.4rem; color: var(--text-secondary); font-size: 0.78rem; text-align: center; }
.usage-status.is-completed { color: var(--success); }
.usage-status.is-failed, .usage-status.is-rejected { color: var(--error); }

@media (max-width: 640px) {
	.panel { padding: 1rem; }
	.panel-header, .section-head { align-items: flex-start; flex-direction: column; }
	.secondary-button { align-self: stretch; }
	.summary-grid { grid-template-columns: 1fr; }
	.token-total { text-align: left; }
	.usage-row { grid-template-columns: 28px minmax(0, 1fr) auto; }
	.usage-tokens { grid-column: 2 / -1; }
}
</style>
