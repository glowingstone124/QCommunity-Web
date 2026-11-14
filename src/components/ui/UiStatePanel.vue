<script setup>
import UiButton from './UiButton.vue'
import { useUiPreferences } from '@/composables/useUiPreferences.js'

defineProps({
	state: {
		type: String,
		default: 'info',
		validator: (value) => ['loading', 'empty', 'error', 'info'].includes(value),
	},
	title: {
		type: String,
		default: '',
	},
	message: {
		type: String,
		default: '',
	},
	icon: {
		type: String,
		default: '',
	},
	actionLabel: {
		type: String,
		default: '',
	},
	actionTo: {
		type: [String, Object],
		default: null,
	},
	actionVariant: {
		type: String,
		default: 'tonal',
	},
	compact: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits(['action'])
const { isModernUi } = useUiPreferences()
</script>

<template>
	<section
		class="ui-state-panel"
		:class="[`ui-state-panel--${state}`, { 'ui-state-panel--compact': compact }]"
		:role="state === 'error' ? 'alert' : state === 'loading' ? 'status' : undefined"
		:aria-live="state === 'loading' ? 'polite' : undefined"
	>
		<div class="ui-state-panel__body">
			<md-circular-progress
				v-if="state === 'loading' && isModernUi"
				indeterminate
				:aria-label="message || title"
				class="ui-state-panel__progress"
			/>
			<span
				v-else-if="state === 'loading'"
				class="ui-state-panel__classic-spinner"
				aria-hidden="true"
			></span>
			<span
				v-else-if="(icon || state === 'error') && isModernUi"
				class="material-symbols-rounded ui-state-panel__icon"
				aria-hidden="true"
			>
				{{ icon || 'error_outline' }}
			</span>

			<div class="ui-state-panel__copy">
				<h2 v-if="title" class="ui-state-panel__title">{{ title }}</h2>
				<p v-if="message" class="ui-state-panel__message">{{ message }}</p>
				<slot />
			</div>
		</div>

		<div v-if="actionLabel || $slots.actions" class="ui-state-panel__actions">
			<slot name="actions">
				<UiButton
					:variant="actionVariant"
					:to="actionTo || undefined"
					@click="!actionTo && emit('action')"
				>
					{{ actionLabel }}
				</UiButton>
			</slot>
		</div>
	</section>
</template>

<style scoped>
.ui-state-panel {
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 1rem 1.25rem;
	padding: 1.15rem 1.25rem;
	border: 1px solid var(--border-soft, var(--split));
	background: var(--background);
	color: var(--text-main);
	line-height: 1.55;
}

.ui-state-panel--compact {
	padding: 0.85rem 1rem;
}

.ui-state-panel--error {
	border-color: var(--error-border, color-mix(in srgb, var(--error) 45%, transparent));
	background: var(--error-container, var(--background));
	color: var(--error-text, var(--error));
}

.ui-state-panel__body {
	display: flex;
	align-items: center;
	gap: 0.85rem;
	min-width: 0;
	flex: 1 1 16rem;
}

.ui-state-panel__progress {
	flex: none;
}

.ui-state-panel__classic-spinner {
	width: 18px;
	height: 18px;
	border: 2px solid var(--split);
	border-top-color: var(--primary);
	border-radius: 50%;
	flex: none;
	animation: ui-state-spin 700ms linear infinite;
}

@keyframes ui-state-spin {
	to {
		transform: rotate(360deg);
	}
}

.ui-state-panel__icon {
	font-size: 1.4rem;
	line-height: 1;
	flex: none;
	color: var(--text-secondary);
}

.ui-state-panel--error .ui-state-panel__icon {
	color: inherit;
}

.ui-state-panel__copy {
	display: grid;
	gap: 0.25rem;
	min-width: 0;
}

.ui-state-panel__title {
	margin: 0;
	color: var(--title-color);
	font-size: 1.06rem;
	font-weight: 700;
	line-height: 1.3;
}

.ui-state-panel--error .ui-state-panel__title {
	color: inherit;
}

.ui-state-panel__message {
	margin: 0;
	color: var(--text-secondary);
	max-width: 65ch;
	text-wrap: pretty;
}

.ui-state-panel--error .ui-state-panel__message {
	color: inherit;
}

.ui-state-panel__actions {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 0.65rem;
	flex: none;
}

/* Material Design 3 State Panel */
:global(:root[data-ui="modern"] .ui-state-panel) {
	border-radius: var(--md-sys-shape-corner-large);
	border-color: color-mix(in srgb, var(--md-sys-color-outline-variant) 45%, transparent);
	background: var(--md-sys-color-surface-container-low);
	color: var(--md-sys-color-on-surface);
}

:global(:root[data-ui="modern"] .ui-state-panel--error) {
	border-color: transparent;
	background: var(--md-sys-color-error-container);
	color: var(--md-sys-color-on-error-container);
}

:global(:root[data-ui="modern"] .ui-state-panel__title) {
	color: var(--md-sys-color-on-surface);
}

:global(:root[data-ui="modern"] .ui-state-panel--error .ui-state-panel__title) {
	color: inherit;
}

:global(:root[data-ui="modern"] .ui-state-panel__message) {
	color: var(--md-sys-color-on-surface-variant);
}

:global(:root[data-ui="modern"] .ui-state-panel--error .ui-state-panel__message) {
	color: inherit;
}
</style>
