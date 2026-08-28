<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
	ipAddr: { type: String, default: '' },
	iplist: { type: Array, default: () => [] },
	isValidIp: { type: Boolean, default: false },
	isSubmitting: { type: Boolean, default: false },
	isLoading: { type: Boolean, default: false },
	deletingIp: { type: String, default: '' },
	feedback: { type: String, default: '' },
	feedbackType: { type: String, default: '' },
})
const { t } = useI18n()

const emit = defineEmits(['submit', 'remove', 'refresh', 'update:ipAddr'])
const ipLimit = 5
const confirmingIp = ref('')
const remainingSlots = computed(() => Math.max(ipLimit - props.iplist.length, 0))
const capacityPercent = computed(() => Math.min((props.iplist.length / ipLimit) * 100, 100))

function confirmRemove(ip) {
	emit('remove', ip)
	confirmingIp.value = ''
}
</script>

<template>
	<section class="panel">
		<header class="panel-header">
			<div>
			<h2 class="panel-title">{{ t('whitelistPage.title') }}</h2>
			<p class="panel-sub">{{ t('whitelistPage.description') }}</p>
			</div>
			<div class="capacity" :aria-label="t('whitelistPage.capacity')">
				<div class="capacity-copy">
					<span>{{ t('whitelistPage.used') }}</span>
					<strong>{{ iplist.length }} / {{ ipLimit }}</strong>
				</div>
				<div class="capacity-track"><span :style="{ width: `${capacityPercent}%` }"></span></div>
			</div>
		</header>

		<div class="workspace">
			<section class="section add-section">
				<div class="section-head">
					<div>
						<h3>{{ t('whitelistPage.register') }}</h3>
						<p>{{ t('whitelistPage.registerDescription') }}</p>
					</div>
					<span class="slot-count">{{ t('whitelistPage.remaining', { count: remainingSlots }) }}</span>
				</div>
				<form class="form-row" @submit.prevent="emit('submit')">
					<label class="ip-field">
						<span class="sr-only">{{ t('whitelistPage.ipAddress') }}</span>
						<input
							:value="props.ipAddr"
							type="text"
							inputmode="text"
							autocomplete="off"
							spellcheck="false"
							:placeholder="t('whitelistPage.ipPlaceholder')"
							@input="emit('update:ipAddr', $event.target.value)"
						/>
					</label>
					<button class="primary-button" type="submit" :disabled="!isValidIp || isSubmitting || remainingSlots === 0">
						<font-awesome-icon :icon="['far', 'square-plus']" aria-hidden="true" />
						<span>{{ isSubmitting ? t('whitelistPage.submitting') : t('whitelistPage.add') }}</span>
					</button>
				</form>
				<p class="helper" :class="{ invalid: ipAddr && !isValidIp }">
					{{ ipAddr && !isValidIp ? t('whitelistPage.invalidIp') : t('whitelistPage.ipOnly') }}
				</p>
				<p v-if="feedback" class="feedback" :class="feedbackType" role="status">{{ feedback }}</p>
			</section>

			<section class="section list-section">
				<div class="section-head list-head">
					<div>
						<h3>{{ t('whitelistPage.registered') }}</h3>
						<p>{{ t('whitelistPage.registeredDescription') }}</p>
					</div>
					<button class="secondary-button" type="button" :disabled="isLoading" @click="emit('refresh')">
						{{ isLoading ? t('common.refreshing') : t('whitelistPage.refreshList') }}
					</button>
				</div>

				<div v-if="isLoading && !iplist.length" class="empty-state">{{ t('whitelistPage.loading') }}</div>
				<TransitionGroup v-else-if="iplist.length" name="ip-list" tag="div" class="ip-list">
					<div v-for="(ip, index) in iplist" :key="ip" class="ip-row" :class="{ 'is-confirming': confirmingIp === ip }">
						<span class="ip-index">{{ String(index + 1).padStart(2, '0') }}</span>
						<div class="ip-copy">
							<code>{{ ip }}</code>
							<span><font-awesome-icon :icon="['far', 'circle-check']" aria-hidden="true" /> {{ t('whitelistPage.enabled') }}</span>
						</div>
						<button
							v-if="confirmingIp !== ip"
							type="button"
							class="icon-button danger"
							:disabled="Boolean(deletingIp)"
							:aria-label="t('whitelistPage.deleteIp', { ip })"
							:title="t('whitelistPage.deleteIpTitle', { ip })"
							@click="confirmingIp = ip"
						>
							<font-awesome-icon :icon="['far', 'trash-can']" aria-hidden="true" />
						</button>
						<div v-else class="remove-confirm">
							<span>{{ t('whitelistPage.removeConfirm') }}</span>
							<button type="button" :disabled="Boolean(deletingIp)" @click="confirmingIp = ''">{{ t('common.cancel') }}</button>
							<button type="button" class="confirm-danger" :disabled="Boolean(deletingIp)" @click="confirmRemove(ip)">
								{{ deletingIp === ip ? t('whitelistPage.removing') : t('whitelistPage.remove') }}
							</button>
						</div>
					</div>
				</TransitionGroup>
				<div v-else class="empty-state">
					<strong>{{ t('whitelistPage.noAddresses') }}</strong>
					<span>{{ t('whitelistPage.noAddressesDescription') }}</span>
				</div>
			</section>
		</div>
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

.panel-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	gap: 2rem;
	padding-bottom: 1.15rem;
	border-bottom: 1px solid var(--border-soft);
	animation: whitelist-block-in 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.panel-title {
	font-size: clamp(1.35rem, 2vw, 1.65rem);
	margin: 0;
	color: var(--title-color);
	line-height: 1.2;
}

.panel-sub,
.section-head p {
	margin: 0.35rem 0 0;
	color: var(--text-secondary);
	line-height: 1.5;
}

.capacity {
	width: min(240px, 32%);
	display: grid;
	gap: 0.55rem;
	flex: 0 0 auto;
}

.capacity-copy {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	color: var(--text-secondary);
	font-size: 0.82rem;
}

.capacity-copy strong { color: var(--text-main); font-size: 1rem; }
.capacity-track { height: 6px; background: var(--surface-soft); border: 1px solid var(--border-soft); overflow: hidden; }
.capacity-track span { display: block; height: 100%; background: var(--primary); transition: width 180ms ease; }

.workspace {
	display: grid;
	grid-template-columns: minmax(300px, 0.8fr) minmax(360px, 1.2fr);
	gap: 1rem;
	align-items: start;
}

.section {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	border: 1px solid var(--border-soft);
	padding: 1rem;
	min-width: 0;
	opacity: 0;
	animation: whitelist-block-in 440ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.section:nth-child(1) { animation-delay: 80ms; }
.section:nth-child(2) { animation-delay: 150ms; }

.section-head { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
.section-head h3 { margin: 0; font-size: 1rem; color: var(--title-color); }
.section-head p { font-size: 0.86rem; }
.slot-count { flex: 0 0 auto; color: var(--primary); font-size: 0.82rem; font-weight: 700; padding-top: 0.1rem; }

.form-row { display: flex; gap: 0.65rem; align-items: stretch; }
.ip-field { flex: 1; min-width: 0; }
input {
	width: 100%;
	height: 44px;
	box-sizing: border-box;
	padding: 0 0.8rem;
	background: var(--glass-soft);
	border: 1px solid var(--border-soft);
	color: var(--text-main);
	font-family: var(--font-mono);
	font-size: 0.9rem;
}
input:focus { outline: 2px solid color-mix(in srgb, var(--primary) 22%, transparent); border-color: var(--primary); }

.primary-button,
.secondary-button,
.icon-button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.45rem;
	border: 1px solid var(--border-soft);
	cursor: pointer;
	font-weight: 600;
}
.primary-button { min-height: 44px; padding: 0 1rem; background: var(--button-primary-bg); border-color: var(--primary); color: var(--button-primary-text); white-space: nowrap; }
.primary-button:hover:not(:disabled) { background: var(--button-primary-hover); }
.secondary-button { padding: 0.5rem 0.75rem; background: transparent; color: var(--text-main); white-space: nowrap; }
.secondary-button:hover:not(:disabled) { border-color: var(--primary); background: var(--surface-soft); }
.primary-button:disabled, .secondary-button:disabled, .icon-button:disabled { opacity: 0.46; cursor: not-allowed; }

.helper, .feedback { margin: 0; font-size: 0.84rem; line-height: 1.45; color: var(--text-secondary); }
.helper.invalid, .feedback.error { color: var(--error); }
.feedback { padding: 0.7rem 0.75rem; border-left: 3px solid var(--error); background: color-mix(in srgb, var(--error) 6%, transparent); }
.feedback.success { color: var(--success); border-color: var(--success); background: color-mix(in srgb, var(--success) 7%, transparent); }

.ip-list { display: grid; gap: 0.5rem; }
.ip-list-enter-active, .ip-list-leave-active { transition: opacity 220ms ease, transform 220ms ease; }
.ip-list-enter-from, .ip-list-leave-to { opacity: 0; transform: translateY(-8px); }
.ip-list-move { transition: transform 220ms ease; }
.ip-row {
	display: grid;
	grid-template-columns: 32px minmax(0, 1fr) 38px;
	gap: 0.7rem;
	align-items: center;
	min-height: 58px;
	padding: 0.5rem 0.55rem;
	background: var(--surface-soft);
	border: 1px solid var(--border-soft);
}
.ip-row.is-confirming { grid-template-columns: 32px minmax(0, 1fr); border-color: color-mix(in srgb, var(--error) 42%, var(--border-soft)); }
.ip-index { color: var(--text-secondary); font-family: var(--font-mono); font-size: 0.75rem; text-align: center; }
.ip-copy { min-width: 0; display: grid; gap: 0.2rem; }
.ip-copy code { color: var(--text-main); font-family: var(--font-mono); font-size: 0.9rem; overflow-wrap: anywhere; }
.ip-copy span { color: var(--success); font-size: 0.76rem; display: inline-flex; align-items: center; gap: 0.3rem; }
.icon-button { width: 36px; height: 36px; padding: 0; background: transparent; color: var(--text-secondary); }
.icon-button.danger:hover:not(:disabled) { color: var(--error); border-color: var(--error); background: color-mix(in srgb, var(--error) 7%, transparent); }
.remove-confirm { grid-column: 1 / -1; display: flex; align-items: center; justify-content: flex-end; gap: 0.4rem; padding-top: 0.5rem; border-top: 1px solid color-mix(in srgb, var(--error) 28%, var(--border-soft)); animation: confirm-row-in 180ms ease both; }
.remove-confirm span { margin-right: auto; color: var(--error); font-size: 0.8rem; }
.remove-confirm button { min-height: 32px; padding: 0 0.65rem; border: 1px solid var(--border-soft); background: transparent; color: var(--text-main); cursor: pointer; font-weight: 600; }
.remove-confirm .confirm-danger { color: white; background: var(--error); border-color: var(--error); }
.remove-confirm button:disabled { opacity: 0.5; cursor: not-allowed; }

.empty-state { min-height: 120px; display: grid; place-content: center; gap: 0.3rem; text-align: center; color: var(--text-secondary); background: var(--surface-soft); border: 1px dashed var(--border-soft); }
.empty-state strong { color: var(--text-main); }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

@keyframes whitelist-block-in {
	from { opacity: 0; transform: translateY(12px); }
	to { opacity: 1; transform: translateY(0); }
}

@keyframes confirm-row-in {
	from { opacity: 0; transform: translateY(-5px); }
	to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 800px) {
	.panel-header { align-items: flex-start; }
	.workspace { grid-template-columns: 1fr; }
	.capacity { width: 180px; }
}

@media (max-width: 560px) {
	.panel { gap: 1rem; }
	.panel-header { flex-direction: column; gap: 1rem; }
	.capacity { width: 100%; }
	.section { padding: 0.85rem; }
	.form-row { flex-direction: column; }
	.primary-button { width: 100%; }
	.list-head { align-items: center; }
	.list-head > div { min-width: 0; }
	.ip-row { grid-template-columns: 26px minmax(0, 1fr) 38px; gap: 0.5rem; }
}

@media (prefers-reduced-motion: reduce) {
	.ip-list-enter-active, .ip-list-leave-active, .ip-list-move { transition: none; }
	.panel-header,
	.section,
	.remove-confirm {
		opacity: 1;
		animation: none;
		transform: none;
	}
}
</style>
