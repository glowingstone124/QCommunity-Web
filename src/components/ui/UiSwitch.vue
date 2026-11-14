<script setup>
import { useUiPreferences } from '@/composables/useUiPreferences.js'

const { isModernUi } = useUiPreferences()

defineProps({
	modelValue: {
		type: Boolean,
		required: true,
	},
	disabled: {
		type: Boolean,
		default: false,
	},
	label: {
		type: String,
		default: '',
	},
	statusText: {
		type: String,
		default: '',
	},
	ariaLabel: {
		type: String,
		default: '',
	},
	size: {
		type: String,
		default: 'default',
		validator: (value) => ['default', 'compact'].includes(value),
	},
})

const emit = defineEmits(['update:modelValue'])

function onChange(event) {
	emit('update:modelValue', Boolean(event.target.checked))
}

function onMdChange(event) {
	emit('update:modelValue', Boolean(event.target?.selected))
}
</script>

<template>
	<label class="ui-switch" :class="[`is-${size}`, { 'is-checked': modelValue, 'is-disabled': disabled }]">
		<span v-if="label || statusText" class="ui-switch-copy">
			<span v-if="label" class="ui-switch-label">{{ label }}</span>
			<span v-if="statusText" class="ui-switch-status">{{ statusText }}</span>
		</span>
		<span class="ui-switch-control">
			<md-switch
				v-if="isModernUi"
				class="ui-md-switch"
				:class="{ 'is-compact': size === 'compact' }"
				:selected.prop="modelValue"
				:disabled="disabled"
				:aria-label="ariaLabel || label || statusText"
				icons
				show-only-selected-icon
				@change="onMdChange"
			/>
			<input
				v-else
				type="checkbox"
				switch
				role="switch"
				class="ui-switch-input"
				:checked="modelValue"
				:aria-checked="modelValue"
				:aria-label="ariaLabel || label || statusText"
				:disabled="disabled"
				@change="onChange"
			/>
		</span>
	</label>
</template>

<style scoped>
.ui-switch {
	display: inline-flex;
	align-items: center;
	gap: 0.65rem;
	min-height: 44px;
	cursor: pointer;
	user-select: none;
	touch-action: manipulation;
}

.ui-switch.is-compact {
	min-height: 40px;
	gap: 0.45rem;
}

.ui-switch.is-disabled {
	cursor: not-allowed;
	opacity: 0.56;
}

.ui-switch-copy {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
}

.ui-switch-label,
.ui-switch-status {
	font-size: 0.9rem;
	font-weight: 600;
	color: var(--text-main);
	white-space: nowrap;
}

.ui-switch-control {
	position: relative;
	display: inline-flex;
	align-items: center;
}

.ui-switch-input {
	appearance: none;
	-webkit-appearance: none;
	position: relative;
	width: 44px;
	height: 24px;
	margin: 0;
	border: 1.5px solid var(--border-strong);
	border-radius: 999px;
	background: var(--surface-soft, var(--background-secondary));
	accent-color: var(--primary);
	cursor: inherit;
	transition:
		background-color var(--motion-fast) var(--ease-out),
		border-color var(--motion-fast) var(--ease-out);
}

.ui-switch.is-compact .ui-switch-input {
	width: 36px;
	height: 20px;
}

.ui-switch-input::before {
	content: '';
	position: absolute;
	top: 2px;
	left: 2px;
	width: 17px;
	height: 17px;
	border-radius: 50%;
	background: var(--text-secondary);
	box-shadow: 0 1px 2px color-mix(in srgb, #000000 22%, transparent);
	transition:
		transform var(--motion-fast) var(--ease-spring, var(--ease-out)),
		background-color var(--motion-fast) var(--ease-out);
}

.ui-switch.is-compact .ui-switch-input::before {
	top: 2px;
	left: 2px;
	width: 13px;
	height: 13px;
}

.ui-switch-input:checked {
	background: var(--button-primary-bg);
	border-color: var(--button-primary-bg);
}

.ui-switch-input:checked::before {
	background: var(--button-primary-text);
	transform: translateX(20px);
}

.ui-switch.is-compact .ui-switch-input:checked::before {
	transform: translateX(16px);
}

.ui-switch-input:focus-visible {
	outline: 2px solid var(--focus-ring, var(--primary));
	outline-offset: 3px;
}

@media (hover: hover) and (pointer: fine) {
	.ui-switch:not(.is-disabled):hover .ui-switch-input:not(:checked) {
		border-color: var(--text-main);
	}
}

@media (prefers-reduced-motion: reduce) {
	.ui-switch-input,
	.ui-switch-input::before {
		transition-duration: 1ms;
	}
}

@media (forced-colors: active) {
	.ui-switch-input:checked {
		forced-color-adjust: none;
		background: Highlight;
		border-color: Highlight;
	}

	.ui-switch-input:checked::before {
		background: HighlightText;
	}
}

/* Material Design 3 Switch Specification */
:global(:root[data-ui="modern"] .ui-switch .ui-switch-input) {
	width: 52px;
	height: 32px;
	border: 2px solid var(--md-sys-color-outline);
	border-radius: var(--md-sys-shape-corner-full);
	background: var(--md-sys-color-surface-container-highest);
	transition:
		background-color 180ms var(--md-sys-motion-easing-standard),
		border-color 180ms var(--md-sys-motion-easing-standard);
}

:global(:root[data-ui="modern"] .ui-switch .ui-switch-input::before) {
	top: 2px;
	left: 2px;
	width: 24px;
	height: 24px;
	background: var(--md-sys-color-outline);
	box-shadow: none;
	transform: translateX(0) scale(0.667);
	transition:
		transform 220ms var(--md-sys-motion-easing-emphasized),
		background-color 180ms var(--md-sys-motion-easing-standard),
		box-shadow 180ms var(--md-sys-motion-easing-standard);
}

:global(:root[data-ui="modern"] .ui-switch .ui-switch-input::after) {
	content: '';
	position: absolute;
	top: 7px;
	left: 27px;
	width: 14px;
	height: 14px;
	background-color: var(--md-sys-color-on-primary-container);
	-webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='black' d='M9.55 18L3.85 12.3L5.275 10.875L9.55 15.15L18.725 5.975L20.15 7.4L9.55 18Z'/%3E%3C/svg%3E");
	mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='black' d='M9.55 18L3.85 12.3L5.275 10.875L9.55 15.15L18.725 5.975L20.15 7.4L9.55 18Z'/%3E%3C/svg%3E");
	-webkit-mask-size: contain;
	mask-size: contain;
	-webkit-mask-repeat: no-repeat;
	mask-repeat: no-repeat;
	opacity: 0;
	transform: scale(0.5);
	transition:
		opacity 160ms var(--md-sys-motion-easing-standard),
		transform 180ms var(--md-sys-motion-easing-emphasized);
	pointer-events: none;
}

:global(:root[data-ui="modern"] .ui-switch .ui-switch-input:checked) {
	background: var(--md-sys-color-primary);
	border-color: var(--md-sys-color-primary);
}

:global(:root[data-ui="modern"] .ui-switch .ui-switch-input:checked::before) {
	background: var(--md-sys-color-on-primary);
	transform: translateX(20px) scale(1);
}

:global(:root[data-ui="modern"] .ui-switch .ui-switch-input:checked::after) {
	opacity: 1;
	transform: scale(1);
}

:global(:root[data-ui="modern"] .ui-switch:not(.is-disabled):active .ui-switch-input:not(:checked)::before) {
	transform: translateX(0) scale(1.08);
}

:global(:root[data-ui="modern"] .ui-switch:not(.is-disabled):active .ui-switch-input:checked::before) {
	transform: translateX(20px) scale(1.12);
}

@media (hover: hover) and (pointer: fine) {
	:global(:root[data-ui="modern"] .ui-switch:not(.is-disabled):hover .ui-switch-input:not(:checked)) {
		border-color: var(--md-sys-color-outline);
	}

	:global(:root[data-ui="modern"] .ui-switch:not(.is-disabled):hover .ui-switch-input:not(:checked)::before) {
		background: var(--md-sys-color-on-surface-variant);
		box-shadow: 0 0 0 11px color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
	}

	:global(:root[data-ui="modern"] .ui-switch:not(.is-disabled):hover .ui-switch-input:checked::before) {
		background: var(--md-sys-color-primary-container);
		box-shadow: 0 0 0 8px color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
	}
}

:global(:root[data-ui="modern"] .ui-switch.is-compact .ui-switch-input) {
	width: 42px;
	height: 26px;
}

:global(:root[data-ui="modern"] .ui-switch.is-compact .ui-switch-input::before) {
	top: 2px;
	left: 2px;
	width: 18px;
	height: 18px;
	transform: translateX(0) scale(0.667);
}

:global(:root[data-ui="modern"] .ui-switch.is-compact .ui-switch-input:checked::before) {
	transform: translateX(16px) scale(1);
}

:global(:root[data-ui="modern"] .ui-switch.is-compact .ui-switch-input::after) {
	top: 5px;
	left: 21px;
	width: 12px;
	height: 12px;
}
</style>
