<script setup>
import { computed } from 'vue'
import { useUiPreferences } from '@/composables/useUiPreferences.js'

const props = defineProps({
	modelValue: {
		type: [String, Number],
		required: true,
	},
	items: {
		type: Array,
		default: () => [],
	},
	variant: {
		type: String,
		default: 'tabs',
		validator: (value) => ['tabs', 'chips', 'segmented'].includes(value),
	},
	ariaLabel: {
		type: String,
		required: true,
	},
	disabled: {
		type: Boolean,
		default: false,
	},
	autoActivate: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits(['update:modelValue', 'select'])

const { isModernUi } = useUiPreferences()

const activeIndex = computed(() => {
	const index = props.items.findIndex((item) => item.key === props.modelValue)
	return index >= 0 ? index : 0
})

function selectItem(item) {
	if (!item || props.disabled || item.disabled) return
	emit('update:modelValue', item.key)
	emit('select', item)
}

function handleMdTabsChange(event) {
	const nextIndex = Number(event?.target?.activeTabIndex)
	if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= props.items.length) return
	const nextItem = props.items[nextIndex]
	if (nextItem) {
		selectItem(nextItem)
	}
}

function handleChipClick(item, event) {
	if (props.disabled || item.disabled) return
	// Keep single-select radio-like filter chips strictly in sync with `modelValue`.
	if (event?.target) {
		event.target.selected = true
	}
	selectItem(item)
}
</script>

<template>
	<div class="ui-tabs" :class="[`ui-tabs--${variant}`]">
		<!-- Genuine Material Design 3 Primary Tabs (single-row scrollable, built-in indicator & arrow navigation) -->
		<md-tabs
			v-if="isModernUi && variant === 'tabs'"
			class="ui-tabs__md-tabs"
			:aria-label="ariaLabel"
			:active-tab-index.prop="activeIndex"
			:auto-activate.prop="autoActivate"
			@change="handleMdTabsChange"
		>
			<md-primary-tab
				v-for="item in items"
				:key="item.key"
				class="ui-tabs__md-tab"
				:inline-icon.prop="true"
				:disabled="disabled || Boolean(item.disabled)"
			>
				<span
					v-if="item.icon"
					slot="icon"
					class="material-symbols-rounded"
					aria-hidden="true"
				>
					{{ item.icon }}
				</span>
				<span class="ui-tabs__md-label">
					{{ item.label }}
					<span v-if="item.badge !== undefined && item.badge !== ''" class="ui-tabs__badge">
						{{ item.badge }}
					</span>
				</span>
			</md-primary-tab>
		</md-tabs>

		<!-- Genuine Material Design 3 Filter Chips (single-select filter group) -->
		<div
			v-else-if="isModernUi && variant === 'chips'"
			class="ui-tabs__chips"
			role="group"
			:aria-label="ariaLabel"
		>
			<md-filter-chip
				v-for="item in items"
				:key="item.key"
				class="ui-tabs__md-chip"
				:label="item.badge !== undefined && item.badge !== '' ? `${item.label} (${item.badge})` : item.label"
				:selected.prop="modelValue === item.key"
				:has-selected-icon="true"
				:disabled="disabled || Boolean(item.disabled)"
				@click.prevent="handleChipClick(item, $event)"
			/>
		</div>

		<!-- Segmented Button Strip OR Classic Fallback for Tabs / Chips -->
		<div
			v-else
			class="ui-tabs__group"
			:class="{ 'is-classic-tabs': !isModernUi && variant === 'tabs' }"
			role="group"
			:aria-label="ariaLabel"
		>
			<button
				v-for="item in items"
				:key="item.key"
				type="button"
				class="ui-tabs__btn"
				:class="{ 'is-active': modelValue === item.key }"
				:aria-pressed="modelValue === item.key"
				:disabled="disabled || Boolean(item.disabled)"
				@click="selectItem(item)"
			>
				<md-ripple v-if="isModernUi" :disabled="disabled || Boolean(item.disabled)" />
				<span
					v-if="isModernUi && modelValue === item.key"
					class="material-symbols-rounded ui-tabs__check"
					aria-hidden="true"
				>
					check
				</span>
				<span
					v-else-if="isModernUi && item.icon"
					class="material-symbols-rounded ui-tabs__icon"
					aria-hidden="true"
				>
					{{ item.icon }}
				</span>
				<span class="ui-tabs__btn-copy">
					<span class="ui-tabs__btn-label">{{ item.label }}</span>
					<small v-if="item.description" class="ui-tabs__btn-desc">{{ item.description }}</small>
				</span>
				<span v-if="item.badge !== undefined && item.badge !== ''" class="ui-tabs__badge">
					{{ item.badge }}
				</span>
			</button>
		</div>
	</div>
</template>

<style scoped>
.ui-tabs {
	min-width: 0;
	max-width: 100%;
}

.ui-tabs__md-tabs {
	max-width: 100%;
	--md-primary-tab-container-color: transparent;
	--md-primary-tab-label-text-font: inherit;
	--md-primary-tab-label-text-size: 0.94rem;
	--md-primary-tab-label-text-weight: 600;
	--md-primary-tab-active-label-text-color: var(--md-sys-color-primary);
	--md-primary-tab-active-icon-color: var(--md-sys-color-primary);
	--md-primary-tab-active-indicator-color: var(--md-sys-color-primary);
	--md-primary-tab-inactive-label-text-color: var(--md-sys-color-on-surface-variant);
	--md-primary-tab-inactive-icon-color: var(--md-sys-color-on-surface-variant);
	--md-divider-color: color-mix(in srgb, var(--md-sys-color-outline-variant) 55%, transparent);
}

.ui-tabs__md-tab {
	min-block-size: 48px;
}

.ui-tabs__md-label {
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
}

.ui-tabs__chips {
	display: flex;
	flex-wrap: wrap;
	gap: 0.55rem;
	align-items: center;
}

.ui-tabs__md-chip {
	--md-filter-chip-label-text-font: inherit;
	--md-filter-chip-label-text-size: 0.88rem;
	--md-filter-chip-label-text-weight: 600;
	--md-filter-chip-selected-container-color: var(--md-sys-color-secondary-container);
	--md-filter-chip-selected-label-text-color: var(--md-sys-color-on-secondary-container);
	--md-filter-chip-selected-leading-icon-color: var(--md-sys-color-on-secondary-container);
	--md-filter-chip-outline-color: color-mix(in srgb, var(--md-sys-color-outline-variant) 85%, transparent);
}

.ui-tabs__group {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.ui-tabs__btn {
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	min-block-size: 40px;
	padding: 0.48rem 0.92rem;
	border: 1px solid var(--border-soft, var(--split));
	background: var(--background);
	color: var(--text-main);
	font-family: inherit;
	font-size: 0.9rem;
	font-weight: 600;
	text-align: left;
	cursor: pointer;
	transition:
		background-color var(--motion-fast, 150ms) var(--ease-standard, ease),
		border-color var(--motion-fast, 150ms) var(--ease-standard, ease),
		color var(--motion-fast, 150ms) var(--ease-standard, ease);
}

.ui-tabs__btn:hover:not(:disabled) {
	border-color: var(--primary);
	background: var(--background-secondary);
}

.ui-tabs__btn.is-active {
	border-color: var(--primary);
	background: color-mix(in srgb, var(--primary) 12%, var(--background));
	color: var(--primary);
}

.ui-tabs__btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.ui-tabs__btn-copy {
	display: grid;
	gap: 0.1rem;
}

.ui-tabs__btn-desc {
	color: var(--text-secondary);
	font-size: 0.78rem;
	font-weight: 400;
}

.ui-tabs__check,
.ui-tabs__icon {
	font-size: 1.05rem;
	line-height: 1;
}

.ui-tabs__badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 1.4rem;
	padding: 0.08rem 0.42rem;
	border-radius: 999px;
	background: color-mix(in srgb, currentColor 14%, transparent);
	font-size: 0.76rem;
	font-variant-numeric: tabular-nums;
	line-height: 1.3;
}

/* Material Design 3 Segmented Control Styling */
:global(:root[data-ui="modern"] .ui-tabs__group) {
	display: inline-flex;
	flex-wrap: wrap;
	gap: 0.35rem;
	padding: 0.3rem;
	border-radius: var(--md-sys-shape-corner-full);
	background: var(--md-sys-color-surface-container);
	border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 50%, transparent);
}

:global(:root[data-ui="modern"] .ui-tabs__btn) {
	border: none;
	border-radius: var(--md-sys-shape-corner-full);
	background: transparent;
	color: var(--md-sys-color-on-surface-variant);
	padding: 0.48rem 1rem;
	overflow: hidden;
}

:global(:root[data-ui="modern"] .ui-tabs__btn:hover:not(:disabled):not(.is-active)) {
	background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
	color: var(--md-sys-color-on-surface);
}

:global(:root[data-ui="modern"] .ui-tabs__btn.is-active) {
	background: var(--md-sys-color-secondary-container);
	color: var(--md-sys-color-on-secondary-container);
}

:global(:root[data-ui="modern"] .ui-tabs__btn.is-active .ui-tabs__btn-desc) {
	color: color-mix(in srgb, var(--md-sys-color-on-secondary-container) 80%, transparent);
}
</style>
