<script setup>
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiPreferences } from '@/composables/useUiPreferences.js'

const props = defineProps({
	modelValue: {
		type: String,
		default: '',
	},
	label: {
		type: String,
		default: '',
	},
	placeholder: {
		type: String,
		default: '',
	},
	id: {
		type: String,
		default: '',
	},
	disabled: {
		type: Boolean,
		default: false,
	},
	clearable: {
		type: Boolean,
		default: true,
	},
	landmark: {
		type: Boolean,
		default: true,
	},
	enterkeyhint: {
		type: String,
		default: 'search',
	},
	hideLabel: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits(['update:modelValue', 'submit', 'clear'])

const generatedId = useId()
const resolvedId = computed(() => props.id || `ui-search-${generatedId}`)
const { t } = useI18n()
const { isModernUi } = useUiPreferences()

function onInput(event) {
	emit('update:modelValue', event.target.value)
}

function clearValue() {
	emit('update:modelValue', '')
	emit('clear')
}
</script>

<template>
	<component :is="landmark ? 'search' : 'div'" class="ui-search">
		<form class="ui-search__form" @submit.prevent="emit('submit', modelValue)">
			<label
				v-if="label"
				:for="resolvedId"
				class="ui-search__label"
				:class="{ 'visually-hidden': hideLabel }"
			>
				{{ label }}
			</label>

			<div class="ui-search__controls">
				<div class="ui-search__field">
					<span
						v-if="isModernUi"
						class="material-symbols-rounded ui-search__leading"
						aria-hidden="true"
					>
						search
					</span>
					<input
						:id="resolvedId"
						:value="modelValue"
						type="search"
						:placeholder="placeholder"
						:disabled="disabled"
						:enterkeyhint="enterkeyhint"
						autocomplete="off"
						autocorrect="off"
						autocapitalize="none"
						spellcheck="false"
						class="ui-search__input"
						@input="onInput"
					/>
					<button
						v-if="clearable && modelValue && !disabled"
						type="button"
						class="ui-search__clear"
						:aria-label="t('common.clear')"
						@click="clearValue"
					>
						<md-ripple v-if="isModernUi" />
						<span v-if="isModernUi" class="material-symbols-rounded" aria-hidden="true">close</span>
						<span v-else aria-hidden="true">×</span>
					</button>
				</div>

				<div v-if="$slots.actions" class="ui-search__actions">
					<slot name="actions" />
				</div>
			</div>
		</form>
	</component>
</template>

<style scoped>
.ui-search {
	display: block;
	min-width: 0;
}

.ui-search__form {
	display: grid;
	gap: 0.45rem;
}

.ui-search__label {
	color: var(--title-color);
	font-size: 0.88rem;
	font-weight: 700;
	line-height: 1.3;
}

.ui-search__controls {
	display: flex;
	align-items: stretch;
	flex-wrap: wrap;
	gap: 0.75rem;
}

.ui-search__field {
	position: relative;
	display: flex;
	align-items: center;
	flex: 1 1 240px;
	min-width: 0;
	min-block-size: 46px;
	padding-inline: 0.85rem;
	gap: 0.55rem;
	border: 1px solid var(--border-soft, var(--split));
	background: var(--background);
	box-sizing: border-box;
	transition:
		border-color var(--motion-fast, 150ms) var(--ease-standard, ease),
		background-color var(--motion-fast, 150ms) var(--ease-standard, ease),
		box-shadow var(--motion-fast, 150ms) var(--ease-standard, ease);
}

.ui-search__field:focus-within {
	border-color: var(--primary);
	outline: 2px solid var(--focus-ring, var(--primary));
	outline-offset: 1px;
}

.ui-search__leading {
	color: var(--text-secondary);
	font-size: 1.2rem;
	line-height: 1;
	flex: none;
}

.ui-search__input {
	flex: 1 1 auto;
	min-width: 0;
	min-block-size: 44px;
	padding: 0.45rem 0;
	border: none !important;
	background: transparent !important;
	box-shadow: none !important;
	color: var(--text-main);
	font-family: inherit;
	font-size: 0.96rem;
	line-height: 1.4;
}

.ui-search__input:focus {
	outline: none !important;
	box-shadow: none !important;
}

.ui-search__input::-webkit-search-cancel-button {
	-webkit-appearance: none;
	appearance: none;
}

.ui-search__clear {
	position: relative;
	display: inline-grid;
	place-items: center;
	flex: none;
	min-width: 34px;
	min-height: 34px;
	padding: 0;
	border: 0;
	border-radius: 999px;
	background: transparent;
	color: var(--text-secondary);
	cursor: pointer;
}

.ui-search__clear:hover {
	color: var(--text-main);
	background: color-mix(in srgb, var(--text-main) 8%, transparent);
}

.ui-search__actions {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 0.6rem;
	flex: none;
}

.visually-hidden {
	position: absolute !important;
	clip-path: inset(50%) !important;
	overflow: hidden !important;
	width: 1px !important;
	height: 1px !important;
	margin: -1px !important;
	padding: 0 !important;
	border: 0 !important;
	white-space: nowrap !important;
}

/* Material Design 3 Search Bar Field */
:global(:root[data-ui="modern"] .ui-search__label) {
	color: var(--md-sys-color-on-surface-variant);
}

:global(:root[data-ui="modern"] .ui-search__field) {
	min-block-size: 48px;
	padding-inline: 1rem 0.6rem;
	border-radius: var(--md-sys-shape-corner-full);
	border-color: color-mix(in srgb, var(--md-sys-color-outline-variant) 75%, transparent);
	background: var(--md-sys-color-surface-container-high);
}

:global(:root[data-ui="modern"] .ui-search__field:hover) {
	background: var(--md-sys-color-surface-container-highest);
}

:global(:root[data-ui="modern"] .ui-search__field:focus-within) {
	border-color: var(--md-sys-color-primary);
	background: var(--md-sys-color-surface-container-lowest);
	outline: none;
	box-shadow: inset 0 0 0 1px var(--md-sys-color-primary), 0 0 0 3px color-mix(in srgb, var(--md-sys-color-primary) 16%, transparent);
}

:global(:root[data-ui="modern"] .ui-search__input) {
	color: var(--md-sys-color-on-surface);
}
</style>
