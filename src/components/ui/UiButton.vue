<script setup>
import { computed } from 'vue'
import { useUiPreferences } from '@/composables/useUiPreferences.js'

defineOptions({ inheritAttrs: false })

const props = defineProps({
	variant: {
		type: String,
		default: 'filled',
		validator: (value) => ['filled', 'tonal', 'outlined', 'text', 'danger'].includes(value),
	},
	size: {
		type: String,
		default: 'md',
		validator: (value) => ['sm', 'md', 'lg'].includes(value),
	},
	type: {
		type: String,
		default: 'button',
	},
	to: {
		type: [String, Object],
		default: null,
	},
	href: {
		type: String,
		default: '',
	},
	target: {
		type: String,
		default: undefined,
	},
	rel: {
		type: String,
		default: undefined,
	},
	icon: {
		type: String,
		default: '',
	},
	trailingIcon: {
		type: String,
		default: '',
	},
	loading: {
		type: Boolean,
		default: false,
	},
	disabled: {
		type: Boolean,
		default: false,
	},
	pressed: {
		type: [Boolean, undefined],
		default: undefined,
	},
	fullWidth: {
		type: Boolean,
		default: false,
	},
	ariaLabel: {
		type: String,
		default: undefined,
	},
})

const { isModernUi } = useUiPreferences()

const isInactive = computed(() => props.disabled || props.loading)
const tag = computed(() => {
	if (props.to) return 'router-link'
	if (props.href) return 'a'
	return 'button'
})
</script>

<template>
	<component
		:is="tag"
		v-bind="$attrs"
		:to="to || undefined"
		:href="href || undefined"
		:target="href ? target : undefined"
		:rel="href ? rel : undefined"
		:type="tag === 'button' ? type : undefined"
		:disabled="tag === 'button' ? isInactive : undefined"
		:aria-disabled="tag !== 'button' && isInactive ? 'true' : undefined"
		:tabindex="tag !== 'button' && isInactive ? '-1' : undefined"
		:aria-pressed="typeof pressed === 'boolean' ? pressed : undefined"
		:aria-busy="loading ? 'true' : undefined"
		:aria-label="ariaLabel"
		class="ui-btn"
		:class="[
			`ui-btn--${variant}`,
			`ui-btn--${size}`,
			{
				'ui-btn--full': fullWidth,
				'ui-btn--loading': loading,
				'is-disabled': isInactive,
			},
		]"
	>
		<md-ripple v-if="isModernUi" :disabled="isInactive" />
		<md-circular-progress
			v-if="loading && isModernUi"
			class="ui-btn__spinner"
			indeterminate
			aria-hidden="true"
		/>
		<span v-else-if="loading" class="ui-btn__classic-spinner" aria-hidden="true"></span>
		<span v-else-if="icon && isModernUi" class="material-symbols-rounded ui-btn__icon" aria-hidden="true">
			{{ icon }}
		</span>
		<span class="ui-btn__label">
			<slot />
		</span>
		<span
			v-if="trailingIcon && isModernUi && !loading"
			class="material-symbols-rounded ui-btn__icon ui-btn__icon--trailing"
			aria-hidden="true"
		>
			{{ trailingIcon }}
		</span>
	</component>
</template>

<style scoped>
.ui-btn {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	min-block-size: 42px;
	padding: 0.55rem 1.05rem;
	border: 1px solid transparent;
	border-radius: var(--ui-radius-sm, 6px);
	font-family: inherit;
	font-size: 0.94rem;
	font-weight: 700;
	line-height: 1.25;
	text-decoration: none;
	cursor: pointer;
	box-sizing: border-box;
	user-select: none;
	white-space: nowrap;
	transition:
		background-color var(--motion-fast, 150ms) var(--ease-standard, ease),
		border-color var(--motion-fast, 150ms) var(--ease-standard, ease),
		color var(--motion-fast, 150ms) var(--ease-standard, ease),
		box-shadow var(--motion-fast, 150ms) var(--ease-standard, ease);
}

.ui-btn--sm {
	min-block-size: 36px;
	padding: 0.4rem 0.85rem;
	font-size: 0.86rem;
}

.ui-btn--lg {
	min-block-size: 48px;
	padding: 0.72rem 1.35rem;
	font-size: 1rem;
}

.ui-btn--full {
	inline-size: 100%;
}

.ui-btn--filled {
	border-color: var(--primary);
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
}

.ui-btn--filled:hover:not(:disabled):not(.is-disabled) {
	background: var(--button-primary-hover);
	border-color: var(--button-primary-hover);
}

.ui-btn--tonal {
	border-color: var(--button-secondary-border, var(--split));
	background: var(--button-tonal-bg, var(--button-secondary-bg));
	color: var(--button-tonal-text, var(--button-secondary-text));
}

.ui-btn--tonal:hover:not(:disabled):not(.is-disabled) {
	background: var(--button-tonal-hover, var(--button-secondary-hover));
}

.ui-btn--outlined {
	border-color: var(--button-secondary-border, var(--split));
	background: transparent;
	color: var(--text-main);
}

.ui-btn--outlined:hover:not(:disabled):not(.is-disabled) {
	border-color: var(--primary);
	background: var(--background-secondary);
}

.ui-btn--text {
	border-color: transparent;
	background: transparent;
	color: var(--primary);
	padding-inline: 0.7rem;
}

.ui-btn--text:hover:not(:disabled):not(.is-disabled) {
	background: var(--button-ghost-hover, color-mix(in srgb, var(--primary) 10%, transparent));
}

.ui-btn--danger {
	border-color: var(--error-border, color-mix(in srgb, var(--error) 45%, transparent));
	background: var(--error-container, var(--background));
	color: var(--error-text, var(--error));
}

.ui-btn--danger:hover:not(:disabled):not(.is-disabled) {
	border-color: var(--error);
}

.ui-btn:disabled,
.ui-btn.is-disabled {
	opacity: 0.56;
	cursor: not-allowed;
	pointer-events: none;
}

.ui-btn__label {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
}

.ui-btn__icon {
	font-size: 1.15rem;
	line-height: 1;
	flex: none;
}

.ui-btn__spinner {
	--md-circular-progress-size: 20px;
	width: 20px;
	height: 20px;
	flex: none;
}

.ui-btn__classic-spinner {
	width: 14px;
	height: 14px;
	border: 2px solid color-mix(in srgb, currentColor 32%, transparent);
	border-top-color: currentColor;
	border-radius: 50%;
	animation: ui-btn-spin 700ms linear infinite;
}

@keyframes ui-btn-spin {
	to {
		transform: rotate(360deg);
	}
}

@media (pointer: coarse) {
	.ui-btn {
		min-block-size: 44px;
	}
}

/* Material Design 3 Unified Button Spec */
:global(:root[data-ui="modern"] .ui-btn) {
	border-radius: var(--md-sys-shape-corner-full);
	overflow: hidden;
	font-weight: 600;
	letter-spacing: 0.01em;
	transition:
		background-color 160ms var(--md-sys-motion-easing-standard),
		border-color 160ms var(--md-sys-motion-easing-standard),
		color 160ms var(--md-sys-motion-easing-standard),
		box-shadow 180ms var(--md-sys-motion-easing-emphasized);
}

:global(:root[data-ui="modern"] .ui-btn--filled) {
	border-color: transparent;
	background: var(--md-sys-color-primary);
	color: var(--md-sys-color-on-primary);
	--md-circular-progress-active-indicator-color: var(--md-sys-color-on-primary);
}

:global(:root[data-ui="modern"] .ui-btn--filled:hover:not(:disabled):not(.is-disabled)) {
	background: color-mix(in srgb, var(--md-sys-color-on-primary) 8%, var(--md-sys-color-primary));
	box-shadow: var(--md-sys-elevation-level1);
}

:global(:root[data-ui="modern"] .ui-btn--tonal) {
	border-color: transparent;
	background: var(--md-sys-color-secondary-container);
	color: var(--md-sys-color-on-secondary-container);
	--md-circular-progress-active-indicator-color: var(--md-sys-color-on-secondary-container);
}

:global(:root[data-ui="modern"] .ui-btn--tonal:hover:not(:disabled):not(.is-disabled)) {
	background: color-mix(in srgb, var(--md-sys-color-on-secondary-container) 8%, var(--md-sys-color-secondary-container));
	box-shadow: var(--md-sys-elevation-level1);
}

:global(:root[data-ui="modern"] .ui-btn--outlined) {
	border-color: var(--md-sys-color-outline);
	background: transparent;
	color: var(--md-sys-color-primary);
}

:global(:root[data-ui="modern"] .ui-btn--outlined:hover:not(:disabled):not(.is-disabled)) {
	border-color: var(--md-sys-color-primary);
	background: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
}

:global(:root[data-ui="modern"] .ui-btn--text) {
	border-color: transparent;
	background: transparent;
	color: var(--md-sys-color-primary);
}

:global(:root[data-ui="modern"] .ui-btn--text:hover:not(:disabled):not(.is-disabled)) {
	background: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
}

:global(:root[data-ui="modern"] .ui-btn--danger) {
	border-color: transparent;
	background: var(--md-sys-color-error-container);
	color: var(--md-sys-color-on-error-container);
}

:global(:root[data-ui="modern"] .ui-btn--danger:hover:not(:disabled):not(.is-disabled)) {
	background: color-mix(in srgb, var(--md-sys-color-on-error-container) 8%, var(--md-sys-color-error-container));
}

:global(:root[data-ui="modern"] .ui-btn:disabled),
:global(:root[data-ui="modern"] .ui-btn.is-disabled) {
	opacity: 1;
	background: color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent);
	color: color-mix(in srgb, var(--md-sys-color-on-surface) 56%, transparent);
	border-color: transparent;
	box-shadow: none;
}

@media (forced-colors: active) {
	.ui-btn {
		border: 1px solid ButtonText;
	}
}
</style>
