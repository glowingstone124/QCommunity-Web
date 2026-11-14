<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UiButton from '@/components/ui/UiButton.vue'
import UiStatePanel from '@/components/ui/UiStatePanel.vue'
import { useUiPreferences } from '@/composables/useUiPreferences.js'
import { isValidQqNumber } from '@/utils/taAccess.js'

const { isModernUi } = useUiPreferences()

const props = defineProps({
	playtime: { type: Number, default: 0 },
	requiredPlaytime: { type: Number, default: 180 },
	remainingMinutes: { type: Number, default: 180 },
	progressPercent: { type: Number, default: 0 },
	canUpgrade: { type: Boolean, default: false },
	submitting: { type: Boolean, default: false },
	errorMessage: { type: String, default: '' },
	pendingCommand: { type: String, default: '' },
})

const emit = defineEmits(['submit-bind'])

const { t } = useI18n()
const qqInput = ref('')
const localValidationError = ref('')
const copied = ref(false)

function handleSubmit() {
	localValidationError.value = ''
	const normalized = qqInput.value.trim()
	if (!props.canUpgrade) {
		localValidationError.value = t('taAccount.insufficientPlaytime', {
			current: props.playtime,
			required: props.requiredPlaytime,
		})
		return
	}
	if (!isValidQqNumber(normalized)) {
		localValidationError.value = t('taAccount.invalidQq')
		return
	}
	emit('submit-bind', normalized)
}

async function copyApprovalCommand() {
	if (!props.pendingCommand) return
	try {
		await navigator.clipboard?.writeText(props.pendingCommand)
		copied.value = true
		setTimeout(() => {
			copied.value = false
		}, 2000)
	} catch {
		copied.value = false
	}
}
</script>

<template>
	<section class="ta-upgrade-card" aria-labelledby="ta-upgrade-heading">
		<div class="ta-upgrade-head">
			<div>
				<span class="ta-badge">{{ t('taAccount.badge') }}</span>
				<h3 id="ta-upgrade-heading" class="ta-title">{{ t('taAccount.title') }}</h3>
			</div>
			<span class="ta-progress-pill">{{ t('taAccount.progressCount', { current: playtime, required: requiredPlaytime }) }}</span>
		</div>

		<p class="ta-description">
			{{ t('taAccount.description', { required: requiredPlaytime }) }}
		</p>

		<div class="ta-progress-block">
			<div class="ta-progress-meta">
				<span>{{ t('taAccount.progressLabel') }}</span>
				<span>{{ progressPercent }}%</span>
			</div>
			<md-linear-progress
				v-if="isModernUi"
				:value.prop="Math.max(0, Math.min(1, Number(progressPercent || 0) / 100))"
				:aria-label="t('taAccount.progressLabel')"
			/>
			<div v-else class="ta-progress-track" role="progressbar" :aria-valuenow="progressPercent" aria-valuemin="0" aria-valuemax="100">
				<div class="ta-progress-fill" :style="{ width: `${progressPercent}%` }"></div>
			</div>
			<p class="ta-progress-hint" :class="{ 'is-ready': canUpgrade }">
				{{ canUpgrade ? t('taAccount.readyToBind') : t('taAccount.remainingMinutes', { remaining: remainingMinutes }) }}
			</p>
		</div>

		<form class="ta-bind-form" @submit.prevent="handleSubmit" novalidate>
			<label class="ta-field" for="ta-qq-input">
				<span class="ta-field-label">{{ t('taAccount.qqLabel') }}</span>
				<div class="ta-input-row">
					<input
						id="ta-qq-input"
						v-model="qqInput"
						type="text"
						inputmode="numeric"
						autocomplete="off"
						class="ta-input"
						:placeholder="t('taAccount.qqPlaceholder')"
						:disabled="submitting"
					/>
					<UiButton
						type="submit"
						variant="filled"
						class="ta-submit-btn"
						:loading="submitting"
						:disabled="!canUpgrade || submitting"
					>
						{{ submitting ? t('taAccount.submittingBind') : t('taAccount.submitBind') }}
					</UiButton>
				</div>
			</label>
		</form>

		<UiStatePanel
			v-if="localValidationError || errorMessage"
			state="error"
			compact
			role="alert"
			:message="localValidationError || errorMessage"
		/>

		<div v-if="pendingCommand" class="ta-pending-box" role="status">
			<h4>{{ t('taAccount.pendingTitle') }}</h4>
			<p>{{ t('taAccount.pendingDescription') }}</p>
			<div class="ta-command-row">
				<code class="ta-command-code">{{ pendingCommand }}</code>
				<UiButton
					type="button"
					variant="tonal"
					size="sm"
					:icon="copied ? 'check' : 'content_copy'"
					class="ta-copy-btn"
					@click="copyApprovalCommand"
				>
					{{ copied ? t('taAccount.copiedCommand') : t('taAccount.copyCommand') }}
				</UiButton>
			</div>
			<a
				href="https://qm.qq.com/q/ca25kxwf0k"
				target="_blank"
				rel="noopener noreferrer"
				class="ta-group-link"
			>
				{{ t('nav.join_us_qq') }}
			</a>
		</div>
	</section>
</template>

<style scoped>
.ta-upgrade-card {
	border: 1px solid var(--border-soft, var(--split));
	background: var(--surface-soft, transparent);
	padding: 1.15rem;
	display: grid;
	gap: 0.9rem;
}

.ta-upgrade-head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
	flex-wrap: wrap;
}

.ta-badge {
	display: inline-block;
	border: 1px solid var(--primary);
	color: var(--primary);
	font-size: 0.78rem;
	font-weight: 700;
	padding: 0.16rem 0.5rem;
	margin-bottom: 0.4rem;
}

.ta-title {
	margin: 0;
	color: var(--title-color, var(--text-main));
	font-size: 1.15rem;
}

.ta-progress-pill {
	font-weight: 700;
	color: var(--primary);
	font-size: 0.92rem;
}

.ta-description {
	margin: 0;
	color: var(--text-secondary);
	font-size: 0.92rem;
	line-height: 1.55;
}

.ta-progress-block {
	display: grid;
	gap: 0.4rem;
}

.ta-progress-meta {
	display: flex;
	justify-content: space-between;
	font-size: 0.85rem;
	color: var(--text-secondary);
}

.ta-progress-track {
	width: 100%;
	height: 8px;
	background: var(--border-soft, var(--split));
	overflow: hidden;
}

.ta-progress-fill {
	height: 100%;
	background: var(--primary);
	transition: width 240ms ease;
}

.ta-progress-hint {
	margin: 0;
	font-size: 0.86rem;
	color: var(--text-secondary);
}

.ta-progress-hint.is-ready {
	color: var(--success-text);
}

.ta-field {
	display: grid;
	gap: 0.4rem;
}

.ta-field-label {
	font-size: 0.88rem;
	color: var(--text-secondary);
}

.ta-input-row {
	display: flex;
	gap: 0.65rem;
	flex-wrap: wrap;
}

.ta-input {
	flex: 1 1 220px;
	min-width: 0;
	border: 1px solid var(--border-soft, var(--split));
	background: var(--background);
	color: var(--text-main);
	padding: 0.68rem 0.85rem;
	font-size: 0.95rem;
}

.ta-input:focus {
	border-color: var(--primary);
}

.ta-input:focus:not(:focus-visible) {
	outline: none;
}

:global(:root:not([data-ui="modern"]) .account .ta-submit-btn),
:global(:root:not([data-ui="modern"]) .account .ta-copy-btn) {
	border: 1px solid var(--primary);
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
	padding: 0.68rem 1rem;
	font-weight: 600;
	cursor: pointer;
}

:global(:root:not([data-ui="modern"]) .account .ta-submit-btn:hover:not(:disabled)),
:global(:root:not([data-ui="modern"]) .account .ta-copy-btn:hover:not(:disabled)) {
	background: var(--button-primary-hover);
}

:global(:root:not([data-ui="modern"]) .account .ta-submit-btn:disabled) {
	opacity: 0.55;
	cursor: not-allowed;
}

.ta-feedback {
	margin: 0;
	font-size: 0.88rem;
}

.ta-feedback.is-error {
	color: var(--error-text);
}

.ta-pending-box {
	border: 1px solid var(--primary);
	background: var(--background);
	padding: 0.95rem;
	display: grid;
	gap: 0.6rem;
}

.ta-pending-box h4 {
	margin: 0;
	color: var(--title-color, var(--text-main));
	font-size: 1rem;
}

.ta-pending-box p {
	margin: 0;
	color: var(--text-secondary);
	font-size: 0.88rem;
	line-height: 1.5;
}

.ta-command-row {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	flex-wrap: wrap;
}

.ta-command-code {
	flex: 1 1 auto;
	padding: 0.55rem 0.75rem;
	border: 1px solid var(--border-soft, var(--split));
	color: var(--text-main);
	font-size: 0.9rem;
	word-break: break-all;
}

.ta-group-link {
	width: fit-content;
	color: var(--primary);
	font-weight: 600;
	text-decoration: underline;
}

/* Material Design 3 TA Upgrade Card */
:global(:root[data-ui="modern"] .account .ta-upgrade-card) {
	border: none;
	border-radius: var(--md-sys-shape-corner-large);
	background: var(--md-sys-color-surface-container);
	box-shadow: var(--md-sys-elevation-level1);
}

:global(:root[data-ui="modern"] .account .ta-badge) {
	border-radius: var(--md-sys-shape-corner-full);
	background: var(--md-sys-color-tertiary-container);
	color: var(--md-sys-color-on-tertiary-container);
}

:global(:root[data-ui="modern"] .account .ta-progress-track) {
	border-radius: var(--md-sys-shape-corner-full);
	background: var(--md-sys-color-surface-container-highest);
}

:global(:root[data-ui="modern"] .account .ta-progress-fill) {
	border-radius: var(--md-sys-shape-corner-full);
	background: var(--md-sys-color-primary);
}

:global(:root[data-ui="modern"] .account .ta-pending-box) {
	border-radius: var(--md-sys-shape-corner-large);
	border-color: color-mix(in srgb, var(--md-sys-color-primary) 40%, transparent);
	background: color-mix(in srgb, var(--md-sys-color-primary-container) 35%, var(--md-sys-color-surface-container-low));
}

:global(:root[data-ui="modern"] .account .ta-command-code) {
	border-radius: var(--md-sys-shape-corner-medium);
	background: var(--md-sys-color-surface-container-lowest);
}
</style>
