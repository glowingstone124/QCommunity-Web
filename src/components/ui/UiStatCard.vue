<script setup>
import { useUiPreferences } from '@/composables/useUiPreferences.js'

defineProps({
	label: {
		type: String,
		required: true,
	},
	value: {
		type: [String, Number],
		required: true,
	},
	helper: {
		type: String,
		default: '',
	},
	icon: {
		type: String,
		default: '',
	},
	tone: {
		type: String,
		default: 'default',
		validator: (value) => ['default', 'primary', 'success', 'warning', 'error'].includes(value),
	},
	interactive: {
		type: Boolean,
		default: false,
	},
	active: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits(['click'])
const { isModernUi } = useUiPreferences()
</script>

<template>
	<button
		v-if="interactive"
		type="button"
		class="ui-stat-card ui-stat-card--interactive"
		:class="[`ui-stat-card--${tone}`, { 'is-active': active }]"
		:aria-pressed="active"
		@click="emit('click', $event)"
	>
		<md-ripple v-if="isModernUi" />
		<div class="ui-stat-card__top">
			<span class="ui-stat-card__label">{{ label }}</span>
			<span
				v-if="icon && isModernUi"
				class="material-symbols-rounded ui-stat-card__icon"
				aria-hidden="true"
			>
				{{ icon }}
			</span>
		</div>
		<strong class="ui-stat-card__value">{{ value }}</strong>
		<span v-if="helper" class="ui-stat-card__helper">{{ helper }}</span>
		<slot />
	</button>

	<article
		v-else
		class="ui-stat-card"
		:class="`ui-stat-card--${tone}`"
	>
		<div class="ui-stat-card__top">
			<span class="ui-stat-card__label">{{ label }}</span>
			<span
				v-if="icon && isModernUi"
				class="material-symbols-rounded ui-stat-card__icon"
				aria-hidden="true"
			>
				{{ icon }}
			</span>
		</div>
		<strong class="ui-stat-card__value">{{ value }}</strong>
		<span v-if="helper" class="ui-stat-card__helper">{{ helper }}</span>
		<slot />
	</article>
</template>

<style scoped>
.ui-stat-card {
	position: relative;
	display: grid;
	align-content: start;
	gap: 0.38rem;
	min-width: 0;
	padding: 1rem 1.15rem;
	border: 1px solid var(--border-soft, var(--split));
	background: var(--background);
	color: var(--text-main);
	text-align: left;
	box-sizing: border-box;
}

.ui-stat-card--interactive {
	font-family: inherit;
	cursor: pointer;
}

.ui-stat-card__top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
}

.ui-stat-card__label {
	color: var(--text-secondary);
	font-size: 0.86rem;
	font-weight: 600;
	line-height: 1.3;
}

.ui-stat-card__icon {
	font-size: 1.15rem;
	line-height: 1;
	color: var(--text-secondary);
}

.ui-stat-card__value {
	color: var(--title-color);
	font-size: clamp(1.3rem, 2.2vw, 1.75rem);
	font-weight: 760;
	line-height: 1.15;
	font-variant-numeric: tabular-nums;
	overflow-wrap: break-word;
}

.ui-stat-card__helper {
	color: var(--text-secondary);
	font-size: 0.82rem;
	line-height: 1.4;
}

.ui-stat-card--success .ui-stat-card__value {
	color: var(--success-text, var(--primary));
}

.ui-stat-card--warning .ui-stat-card__value {
	color: var(--warning-text, var(--warning));
}

.ui-stat-card--error .ui-stat-card__value {
	color: var(--error-text, var(--error));
}

.ui-stat-card--primary .ui-stat-card__value {
	color: var(--primary);
}

/* Material Design 3 Tonal Stat Card */
:global(:root[data-ui="modern"] .ui-stat-card) {
	border-radius: var(--md-sys-shape-corner-large);
	border-color: color-mix(in srgb, var(--md-sys-color-outline-variant) 42%, transparent);
	background: var(--md-sys-color-surface-container-low);
	box-shadow: var(--md-sys-elevation-level1);
	transition:
		background-color 180ms var(--md-sys-motion-easing-standard),
		border-color 180ms var(--md-sys-motion-easing-standard),
		box-shadow 180ms var(--md-sys-motion-easing-emphasized);
}

:global(:root[data-ui="modern"] .ui-stat-card__icon) {
	display: inline-grid;
	place-items: center;
	width: 30px;
	height: 30px;
	border-radius: var(--md-sys-shape-corner-small);
	background: var(--md-sys-color-surface-container-high);
	color: var(--md-sys-color-on-surface-variant);
}

:global(:root[data-ui="modern"] .ui-stat-card--primary .ui-stat-card__icon) {
	background: var(--md-sys-color-primary-container);
	color: var(--md-sys-color-on-primary-container);
}

:global(:root[data-ui="modern"] .ui-stat-card--success .ui-stat-card__icon) {
	background: var(--md-sys-color-success-container);
	color: var(--md-sys-color-on-success-container);
}

:global(:root[data-ui="modern"] .ui-stat-card--warning .ui-stat-card__icon) {
	background: var(--md-sys-color-warning-container);
	color: var(--md-sys-color-on-warning-container);
}

:global(:root[data-ui="modern"] .ui-stat-card--error .ui-stat-card__icon) {
	background: var(--md-sys-color-error-container);
	color: var(--md-sys-color-on-error-container);
}

:global(:root[data-ui="modern"] .ui-stat-card--interactive.is-active) {
	background: var(--md-sys-color-secondary-container);
	border-color: transparent;
}

:global(:root[data-ui="modern"] .ui-stat-card--interactive.is-active .ui-stat-card__label),
:global(:root[data-ui="modern"] .ui-stat-card--interactive.is-active .ui-stat-card__value),
:global(:root[data-ui="modern"] .ui-stat-card--interactive.is-active .ui-stat-card__helper) {
	color: var(--md-sys-color-on-secondary-container);
}
</style>
