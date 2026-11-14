<template>
	<div class="misc-page page-shell">
		<UiPageHeader
			:title="t('miscPage.title')"
			:subtitle="t('miscPage.description')"
			:divider="false"
		>
			<UiTabs
				v-model="activeKey"
				:items="menuItems"
				variant="tabs"
				:aria-label="t('miscPage.nav_label')"
			/>
		</UiPageHeader>

		<section class="content">
			<component :is="activeComponent" />
		</section>
	</div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BeaconColorComponent from '@/components/BeaconColorComponent.vue'
import CoverGeneratorComponent from '@/components/CoverGeneratorComponent.vue'
import FortuneComponent from '@/components/FortuneComponent.vue'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'
import UiTabs from '@/components/ui/UiTabs.vue'

const activeKey = ref('fortune')
const { t } = useI18n()

const menuItems = computed(() => [
	{
		key: 'fortune',
		label: t('miscPage.fortune'),
		icon: 'auto_awesome',
		component: FortuneComponent,
	},
	{
		key: 'beacon-color',
		label: t('miscPage.beacon_color'),
		icon: 'light_mode',
		component: BeaconColorComponent,
	},
	{
		key: 'cover-generator',
		label: t('miscPage.cover_generator'),
		icon: 'image',
		component: CoverGeneratorComponent,
	},
])

const activeComponent = computed(() => {
	return (
		menuItems.value.find((item) => item.key === activeKey.value)?.component || FortuneComponent
	)
})
</script>

<style scoped>
.misc-page {
	--misc-border: color-mix(in srgb, var(--text-main) 14%, transparent);
	--border-soft: var(--misc-border);
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	width: min(1340px, 100%);
	min-height: calc(100dvh - var(--app-header-height, 0px));
	margin-inline: auto;
	background: var(--page-background);
	color: var(--text-main);
	padding: clamp(1.25rem, 3.5vw, 2.5rem) clamp(1.25rem, 4vw, 3rem) 4rem;
	box-sizing: border-box;
}

:global(:root[data-theme='dark'] .misc-page) {
	--misc-border: color-mix(in srgb, var(--dark-text-primary) 18%, transparent);
}

.content {
	min-height: 0;
}

@media (max-width: 760px) {
	.misc-page {
		padding: 1rem;
	}
}

:global(:root[data-ui="modern"] .misc-page) {
	background: var(--md-sys-color-surface);
	--misc-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 55%, transparent);
}
</style>
