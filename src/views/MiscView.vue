<template>
	<div class="misc-page">
		<header class="page-header">
			<div>
				<h1>小功能</h1>
				<p>轻量工具与账号相关的小组件。</p>
			</div>
		</header>

		<AppNavigation
			:items="menuItems"
			:active-key="activeKey"
			orientation="horizontal"
			density="panel"
			aria-label="小功能导航"
			@select="switchComponent"
		/>

		<main class="content">
			<component :is="activeComponent" />
		</main>
	</div>
</template>

<script setup>
import { computed, ref } from 'vue'
import BeaconColorComponent from "@/components/BeaconColorComponent.vue";
import FortuneComponent from "@/components/FortuneComponent.vue";
import AppNavigation from "@/components/ui/AppNavigation.vue";

const activeKey = ref('fortune')

const menuItems = [
	{
		key: 'fortune',
		label: '今日运势',
		description: '查看账号今日指数',
		component: FortuneComponent,
	},
	{
		key: 'beacon-color',
		label: '信标颜色',
		description: 'Java 光束颜色序列',
		component: BeaconColorComponent,
	},
]

const activeComponent = computed(() => {
	return menuItems.find((item) => item.key === activeKey.value)?.component || FortuneComponent
})

const switchComponent = (item) => {
	activeKey.value = item.key
}
</script>

<style scoped>
.misc-page {
	--misc-border: color-mix(in srgb, var(--text-main) 14%, transparent);
	--border-soft: var(--misc-border);
	display: flex;
	flex-direction: column;
	gap: 1rem;
	height: 100%;
	min-height: calc(100dvh - var(--app-header-height, 0px));
	background: var(--background-secondary);
	color: var(--text-main);
	padding: 1rem;
	box-sizing: border-box;
	overflow: auto;
}

:global(:root[data-theme='dark']) .misc-page {
	--misc-border: color-mix(in srgb, var(--dark-text-primary) 18%, transparent);
}

.page-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid var(--misc-border);
}

.page-header h1 {
	margin: 0;
	color: var(--title-color);
	font-size: clamp(1.55rem, 2.2vw, 2.15rem);
	line-height: 1.15;
}

.page-header p {
	margin: 0.35rem 0 0;
	color: var(--text-secondary);
	line-height: 1.5;
}

.content {
	min-height: 0;
}

@media (max-width: 760px) {
	.misc-page {
		padding: 0.85rem;
	}
}
</style>
