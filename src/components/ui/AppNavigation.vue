<script setup>
import { useUiPreferences } from '@/composables/useUiPreferences.js'

const { isModernUi } = useUiPreferences()

defineProps({
	activeKey: {
		type: [String, Number],
		default: null,
	},
	ariaLabel: {
		type: String,
		default: '',
	},
	density: {
		type: String,
		default: 'panel',
		validator: (value) => ['header', 'panel', 'compact'].includes(value),
	},
	items: {
		type: Array,
		default: () => [],
	},
	orientation: {
		type: String,
		default: 'vertical',
		validator: (value) => ['horizontal', 'vertical'].includes(value),
	},
})

const emit = defineEmits(['activate', 'clear', 'select'])
</script>

<template>
	<nav
		class="app-navigation"
		:class="[`is-${orientation}`, `is-${density}`]"
		:aria-label="ariaLabel || $t('common.navigation')"
		@mouseleave="emit('clear', $event)"
		@focusout="emit('clear', $event)"
	>
		<div
			v-for="item in items"
			:key="item.key"
			class="app-navigation-entry"
		>
			<button
				type="button"
				class="app-navigation-item"
				:class="{
					'is-active': activeKey === item.key,
					'is-route-current': Boolean(item.current),
				}"
				:aria-current="item.current ? 'page' : undefined"
				:aria-expanded="item.hasSubmenu ? String(activeKey === item.key) : undefined"
				:disabled="item.disabled"
				@click="emit('select', item)"
				@focus="emit('activate', item)"
				@mouseenter="emit('activate', item)"
			>
				<md-ripple v-if="isModernUi" :disabled="Boolean(item.disabled)" />
				<span class="app-navigation-copy">
					<span class="app-navigation-title">{{ item.label }}</span>
					<span v-if="item.description" class="app-navigation-desc">{{ item.description }}</span>
				</span>
				<span class="app-navigation-indicator" aria-hidden="true"></span>
			</button>
		</div>
	</nav>
</template>

<style scoped>
.app-navigation {
	--navigation-accent: var(--text-main);
	--navigation-hover-bg: var(--background-secondary);
	--navigation-muted: var(--text-secondary);
	--navigation-border: var(--border-soft, var(--split));
	--navigation-pad-x: 0.7rem;
	--navigation-pad-y: 0.82rem;
	--navigation-min-height: 0;
	--navigation-active-indent: 0.35rem;
	display: flex;
	color: var(--text-main);
}

.app-navigation.is-horizontal {
	flex-direction: row;
	align-items: stretch;
	gap: 0.15rem;
}

.app-navigation.is-vertical {
	flex-direction: column;
	gap: 0.25rem;
}

.app-navigation.is-panel {
	border-top: 1px solid var(--navigation-border);
	border-bottom: 1px solid var(--navigation-border);
	padding: 0.25rem 0;
}

.app-navigation.is-header {
	align-self: stretch;
	--navigation-pad-x: 0.9rem;
	--navigation-pad-y: 0;
	--navigation-min-height: 100%;
	--navigation-hover-bg: var(--background-secondary);
}

.app-navigation.is-compact {
	--navigation-pad-x: 0.7rem;
	--navigation-pad-y: 0.72rem;
	--navigation-min-height: 0;
	--navigation-active-indent: 0;
	gap: 0.45rem;
}

.app-navigation-entry {
	display: flex;
	min-width: 0;
}

.app-navigation.is-vertical .app-navigation-entry {
	width: 100%;
}

.app-navigation.is-horizontal .app-navigation-entry {
	align-items: stretch;
}

.app-navigation-item {
	width: 100%;
	min-height: var(--navigation-min-height);
	border: none;
	background: transparent;
	border-radius: 0;
	padding: var(--navigation-pad-y) var(--navigation-pad-x);
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.55rem;
	text-align: left;
	position: relative;
	color: var(--text-main);
	cursor: pointer;
	transition:
		background-color 160ms var(--ease-out),
		color 160ms var(--ease-out),
		transform 160ms var(--ease-out);
}

.app-navigation.is-vertical .app-navigation-item {
	justify-content: flex-start;
}

.app-navigation.is-compact .app-navigation-item {
	border-left: 1px solid var(--split);
}

.app-navigation-item:disabled {
	cursor: not-allowed;
	opacity: 0.5;
}

.app-navigation-copy {
	min-width: 0;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.25rem;
	color: currentColor;
}

.app-navigation-title {
	color: currentColor;
	font-size: 0.96rem;
	font-weight: 600;
	line-height: 1.2;
	white-space: nowrap;
}

.app-navigation-desc {
	display: none;
	color: var(--navigation-muted);
	font-size: 0.82rem;
	font-weight: 450;
	line-height: 1.45;
	white-space: normal;
}

.app-navigation-item.is-active .app-navigation-title {
	font-weight: 700;
}

.app-navigation-indicator {
	position: absolute;
	background: var(--navigation-accent);
	transform-origin: center;
	transition: transform 160ms var(--ease-out);
}

.app-navigation.is-horizontal .app-navigation-indicator {
	left: var(--navigation-pad-x);
	right: var(--navigation-pad-x);
	bottom: 0;
	height: 2px;
	transform: scaleX(0);
}

.app-navigation.is-vertical .app-navigation-indicator {
	left: 0;
	top: 0;
	bottom: 0;
	width: 2px;
	transform: scaleY(0);
}

.app-navigation.is-panel .app-navigation-item:focus-visible,
.app-navigation.is-panel .app-navigation-item.is-active {
	background: var(--navigation-accent);
	color: var(--background);
}

.app-navigation.is-panel .app-navigation-item:focus-visible {
	outline: 2px solid var(--focus-ring, var(--primary));
	outline-offset: -2px;
}

.app-navigation.is-header .app-navigation-item:focus-visible,
.app-navigation.is-header .app-navigation-item.is-active,
.app-navigation.is-compact .app-navigation-item:focus-visible,
.app-navigation.is-compact .app-navigation-item.is-active {
	background: var(--navigation-hover-bg);
}

.app-navigation.is-header .app-navigation-item:focus-visible,
.app-navigation.is-compact .app-navigation-item:focus-visible {
	outline: 2px solid var(--focus-ring, var(--primary));
	outline-offset: -2px;
}

.app-navigation.is-compact .app-navigation-item:focus-visible {
	border-color: var(--navigation-accent);
	transform: translateX(2px);
}

.app-navigation-item:focus-visible .app-navigation-indicator,
.app-navigation-item.is-active .app-navigation-indicator {
	transform: scale(1);
}

@media (hover: hover) and (pointer: fine) {
	.app-navigation.is-panel .app-navigation-item:hover {
		background: var(--navigation-accent);
		color: var(--background);
	}

	.app-navigation.is-header .app-navigation-item:hover,
	.app-navigation.is-compact .app-navigation-item:hover {
		background: var(--navigation-hover-bg);
		outline: none;
	}

	.app-navigation.is-compact .app-navigation-item:hover {
		border-color: var(--navigation-accent);
		transform: translateX(2px);
	}

	.app-navigation-item:hover .app-navigation-indicator {
		transform: scale(1);
	}
}

@media (max-width: 960px) {
	.app-navigation.is-header {
		min-height: 44px;
	}

	.app-navigation.is-header .app-navigation-entry {
		flex: 0 0 auto;
	}

	.app-navigation.is-header .app-navigation-item {
		min-height: 44px;
		padding-inline: 0.8rem;
	}

	.app-navigation.is-panel {
		flex-direction: row;
		flex-wrap: wrap;
		border: none;
		padding: 0;
	}

	.app-navigation.is-panel .app-navigation-entry {
		flex: 1 1 160px;
	}

	.app-navigation.is-panel .app-navigation-item {
		border: 1px solid var(--navigation-border);
		padding: 0.82rem 0.9rem;
	}

	.app-navigation.is-panel .app-navigation-item:focus-visible,
	.app-navigation.is-panel .app-navigation-item.is-active {
		padding-left: 1.15rem;
	}
}

@media (max-width: 640px) {
	.app-navigation.is-panel .app-navigation-entry {
		flex: 1 1 100%;
	}
}

/* Material Design 3 Navigation Bar, Drawer Pills & Menu Cards */
:global(:root[data-ui="modern"] .app-navigation) {
	--navigation-accent: var(--md-sys-color-primary);
	--navigation-hover-bg: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
}

:global(:root[data-ui="modern"] .app-navigation.is-header) {
	gap: 0.35rem;
	align-items: center;
}

:global(:root[data-ui="modern"] .app-navigation.is-header .app-navigation-item) {
	min-height: 40px;
	padding: 0.45rem 0.95rem;
	border-radius: var(--md-sys-shape-corner-full);
	color: var(--md-sys-color-on-surface-variant);
	transition: background-color 160ms var(--md-sys-motion-easing-standard), color 160ms var(--md-sys-motion-easing-standard);
}

:global(:root[data-ui="modern"] .app-navigation.is-header .app-navigation-indicator),
:global(:root[data-ui="modern"] .app-navigation.is-panel .app-navigation-indicator) {
	display: none;
}

:global(:root[data-ui="modern"] .app-navigation.is-header .app-navigation-item.is-route-current),
:global(:root[data-ui="modern"] .app-navigation.is-header .app-navigation-item.is-active) {
	background: var(--md-sys-color-secondary-container);
	color: var(--md-sys-color-on-secondary-container);
}

:global(:root[data-ui="modern"] .app-navigation.is-header .app-navigation-item.is-route-current .app-navigation-title),
:global(:root[data-ui="modern"] .app-navigation.is-header .app-navigation-item.is-active .app-navigation-title) {
	font-weight: 700;
}

@media (hover: hover) and (pointer: fine) {
	:global(:root[data-ui="modern"] .app-navigation.is-header .app-navigation-item:not(.is-active):not(.is-route-current):hover) {
		background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
		color: var(--md-sys-color-on-surface);
	}

	:global(:root[data-ui="modern"] .app-navigation.is-header .app-navigation-item.is-active:hover),
	:global(:root[data-ui="modern"] .app-navigation.is-header .app-navigation-item.is-route-current:hover) {
		background: color-mix(in srgb, var(--md-sys-color-on-secondary-container) 8%, var(--md-sys-color-secondary-container));
	}
}

:global(:root[data-ui="modern"] .app-navigation.is-panel) {
	gap: 0.35rem;
	border: none;
	padding: 0;
}

:global(:root[data-ui="modern"] .app-navigation.is-panel .app-navigation-item) {
	min-height: 48px;
	padding: 0.7rem 1.15rem;
	border: none;
	border-radius: var(--md-sys-shape-corner-full);
	color: var(--md-sys-color-on-surface-variant);
}

:global(:root[data-ui="modern"] .app-navigation.is-panel .app-navigation-item.is-active),
:global(:root[data-ui="modern"] .app-navigation.is-panel .app-navigation-item.is-route-current),
:global(:root[data-ui="modern"] .app-navigation.is-panel .app-navigation-item:focus-visible) {
	background: var(--md-sys-color-secondary-container);
	color: var(--md-sys-color-on-secondary-container);
	padding-left: 1.15rem;
}

@media (hover: hover) and (pointer: fine) {
	:global(:root[data-ui="modern"] .app-navigation.is-panel .app-navigation-item:not(.is-active):not(.is-route-current):hover) {
		background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
		color: var(--md-sys-color-on-surface);
	}

	:global(:root[data-ui="modern"] .app-navigation.is-panel .app-navigation-item.is-active:hover),
	:global(:root[data-ui="modern"] .app-navigation.is-panel .app-navigation-item.is-route-current:hover) {
		background: color-mix(in srgb, var(--md-sys-color-on-secondary-container) 8%, var(--md-sys-color-secondary-container));
		color: var(--md-sys-color-on-secondary-container);
	}
}

:global(:root[data-ui="modern"] .app-navigation.is-compact) {
	gap: 0.65rem;
}

:global(:root[data-ui="modern"] .app-navigation.is-compact .app-navigation-desc) {
	display: block;
}

:global(:root[data-ui="modern"] .app-navigation.is-compact .app-navigation-item) {
	border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 45%, transparent);
	border-radius: var(--md-sys-shape-corner-large);
	padding: 0.9rem 1.05rem;
	background: var(--md-sys-color-surface-container-low);
	color: var(--md-sys-color-on-surface);
	transition: background-color 160ms var(--md-sys-motion-easing-standard), border-color 160ms var(--md-sys-motion-easing-standard), transform 140ms var(--md-sys-motion-easing-emphasized);
}

:global(:root[data-ui="modern"] .app-navigation.is-compact .app-navigation-item.is-active),
:global(:root[data-ui="modern"] .app-navigation.is-compact .app-navigation-item.is-route-current) {
	background: var(--md-sys-color-secondary-container);
	color: var(--md-sys-color-on-secondary-container);
	border-color: transparent;
}

@media (hover: hover) and (pointer: fine) {
	:global(:root[data-ui="modern"] .app-navigation.is-compact .app-navigation-item:not(.is-active):not(.is-route-current):hover) {
		background: color-mix(in srgb, var(--md-sys-color-primary) 8%, var(--md-sys-color-surface-container-low));
		border-color: color-mix(in srgb, var(--md-sys-color-primary) 35%, transparent);
		transform: translateX(2px);
	}
}
</style>
