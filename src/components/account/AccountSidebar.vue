<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppNavigation from '@/components/ui/AppNavigation.vue'
import { useUiPreferences } from '@/composables/useUiPreferences.js'

const props = defineProps({
	currentSetting: {
		type: Number,
		required: true,
	},
	tabs: {
		type: Array,
		default: () => [],
	},
})

const emit = defineEmits(['select', 'logout'])
const { t } = useI18n()
const { isModernUi } = useUiPreferences()

const navigationItems = computed(() =>
	props.tabs.map((tab) => ({
		key: tab.id,
		label: tab.titleKey ? t(tab.titleKey) : tab.title,
		description: tab.descriptionKey ? t(tab.descriptionKey) : tab.description,
	}))
)
</script>

<template>
	<aside class="side">
		<div class="side-header">
			<h1>{{ t('accountPage.title') }}</h1>
		</div>
		<AppNavigation
			:active-key="currentSetting"
			:items="navigationItems"
			:aria-label="t('accountPage.navigation')"
			density="panel"
			orientation="vertical"
			@select="emit('select', $event.key)"
		/>
		<div class="side-foot">
			<button type="button" class="logout-button" @click="emit('logout')">
				<md-ripple v-if="isModernUi" />
				<span class="logout-title">{{ t('accountPage.logout') }}</span>
				<span class="logout-desc">{{ t('accountPage.logoutDescription') }}</span>
			</button>
		</div>
	</aside>
</template>

<style scoped>
.side {
	position: sticky;
	top: 1rem;
	align-self: start;
	display: flex;
	flex-direction: column;
	gap: 1rem;
	font-family: 'GSans', 'Inter', sans-serif;
	min-height: calc(100dvh - var(--app-header-height) - 4rem);
	border: none;
	background: transparent;
	border-radius: 0;
	padding: 0;
}

.side-header h1 {
	margin: 0.35rem 0 0.25rem;
	font-size: 1.7rem;
	line-height: 1.1;
	color: var(--title-color);
}

.side-header {
	animation: account-side-item-in 420ms var(--ease-out) both;
}

.side :deep(.app-navigation-entry) {
	opacity: 0;
	animation: account-side-item-in 200ms var(--ease-out) forwards;
}

.side :deep(.app-navigation-entry:nth-child(1)) { animation-delay: 20ms; }
.side :deep(.app-navigation-entry:nth-child(2)) { animation-delay: 40ms; }
.side :deep(.app-navigation-entry:nth-child(3)) { animation-delay: 60ms; }
.side :deep(.app-navigation-entry:nth-child(4)) { animation-delay: 80ms; }
.side :deep(.app-navigation-entry:nth-child(5)) { animation-delay: 100ms; }
.side :deep(.app-navigation-entry:nth-child(6)) { animation-delay: 120ms; }

.side-sub {
	margin: 0;
	color: var(--text-secondary);
	line-height: 1.5;
	font-size: 0.92rem;
}

.side-foot {
	margin-top: auto;
	display: flex;
	flex-direction: column;
	gap: 0.9rem;
	opacity: 0;
	animation: account-side-item-in 200ms var(--ease-out) 60ms forwards;
}

.logout-button {
	width: 100%;
	border: 1px solid color-mix(in srgb, var(--error) 55%, transparent);
	background: transparent;
	border-radius: 0;
	padding: 0.82rem 0.9rem;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.25rem;
	text-align: left;
	cursor: pointer;
	color: var(--error-text);
	transition:
		color 0.2s var(--ease-out),
		background-color 0.2s var(--ease-out),
		border-color 0.2s var(--ease-out);
}

.logout-button:hover {
	background: var(--error-solid);
	border-color: var(--error-solid);
	color: white;
}

.logout-title {
	font-size: 1rem;
	font-weight: 700;
	color: currentColor;
}

.logout-desc {
	color: var(--text-secondary);
	font-size: 0.88rem;
}

.logout-button:hover .logout-desc {
	color: rgba(255, 255, 255, 0.9);
}

@keyframes account-side-item-in {
	from { opacity: 0; transform: translateX(-10px); }
	to { opacity: 1; transform: translateX(0); }
}

@media (max-width: 960px) {
	.side {
		position: static;
		min-height: auto;
		gap: 0.75rem;
	}

	.side-foot {
		margin-top: 0;
		display: grid;
		grid-template-columns: minmax(220px, 0.8fr) minmax(300px, 1.2fr);
	}
}

@media (max-width: 640px) {
	.side-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}

	.side-header h1 {
		font-size: 1.4rem;
		margin: 0;
		white-space: nowrap;
	}

	.side-sub,
	.logout-desc {
		display: none;
	}

	.side :deep(.app-navigation.is-panel) {
		display: grid;
		grid-template-columns: repeat(6, minmax(112px, 1fr));
		gap: 0.4rem;
		overflow-x: auto;
		padding-bottom: 0.2rem;
		scrollbar-width: none;
	}

	.side :deep(.app-navigation.is-panel::-webkit-scrollbar) {
		display: none;
	}

	.side :deep(.app-navigation.is-panel .app-navigation-entry) {
		width: auto;
		min-width: 0;
	}

	.side :deep(.app-navigation.is-panel .app-navigation-item),
	.side :deep(.app-navigation.is-panel .app-navigation-item:hover),
	.side :deep(.app-navigation.is-panel .app-navigation-item:focus-visible),
	.side :deep(.app-navigation.is-panel .app-navigation-item.is-active) {
		padding: 0.7rem 0.75rem;
		justify-content: center;
	}

	.side-foot {
		display: block;
	}

	.logout-button {
		padding: 0.65rem 0.8rem;
		align-items: center;
	}

	.logout-title {
		font-size: 0.9rem;
	}
}

@media (prefers-reduced-motion: reduce) {
	.side-header,
	.side-foot,
	.side :deep(.app-navigation-entry) {
		opacity: 1;
		animation: none;
		transform: none;
	}
}

/* Material Design 3 Navigation Drawer Sidebar */
:global(:root[data-ui="modern"] .account .side) {
	background: var(--md-sys-color-surface-container);
	border-radius: var(--md-sys-shape-corner-extra-large);
	padding: 1.25rem 1rem;
	border: none;
}

:global(:root[data-ui="modern"] .account .side .logout-button) {
	position: relative;
	overflow: hidden;
	border: 1px solid transparent;
	border-radius: var(--md-sys-shape-corner-large);
	background: color-mix(in srgb, var(--md-sys-color-error-container) 78%, transparent);
	color: var(--md-sys-color-on-error-container);
	padding: 0.9rem 1.05rem;
}

:global(:root[data-ui="modern"] .account .side .logout-desc) {
	color: color-mix(in srgb, var(--md-sys-color-on-error-container) 82%, transparent);
}

:global(:root[data-ui="modern"] .account .side .logout-button:hover) {
	background: var(--md-sys-color-error);
	border-color: var(--md-sys-color-error);
	color: var(--md-sys-color-on-error);
}

:global(:root[data-ui="modern"] .account .side .logout-button:hover .logout-desc) {
	color: var(--md-sys-color-on-error);
}
</style>
