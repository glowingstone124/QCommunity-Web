<script setup lang="ts">
import { ref, computed } from "vue"
import ArtCard from "@/components/ArtCard.vue"
import AllCardsComponent from "@/components/AllCardsComponent.vue"
import MyCardsComponent from "@/components/MyCardsComponent.vue";
import ChangeAvatarComponent from "@/components/ChangeAvatarComponent.vue";

const selectedIndex = ref<0 | 1>(0)

const selectModule = ref(0)

const componentsList = [AllCardsComponent, MyCardsComponent]

const currentComponent = computed(() => componentsList[selectedIndex.value])

</script>

<template>
	<div class="personalization">
		<header class="personalization-header">
			<div>
				<p class="eyebrow">个性化</p>
				<h2>卡面与头像</h2>
				<p class="sub">管理个人展示卡与头像样式。</p>
			</div>
			<div class="tab-group">
				<button class="tab" :class="{ active: selectModule === 0 }" @click="selectModule = 0">卡面</button>
				<button class="tab" :class="{ active: selectModule === 1 }" @click="selectModule = 1">头像</button>
			</div>
		</header>

		<div class="layout">
			<aside class="preview">
				<h3>预览</h3>
				<div class="preview-card">
					<ArtCard :scale="0.6" id="1" />
				</div>
			</aside>

			<section class="controls">
				<div v-show="selectModule === 0" class="customizationFatherContainer">
					<div class="btn-group">
						<button :class="{ active: selectedIndex === 0 }" @click="selectedIndex = 0">
							所有卡片
						</button>
						<button :class="{ active: selectedIndex === 1 }" @click="selectedIndex = 1">
							我的卡片
						</button>
					</div>
					<component :is="currentComponent"/>
				</div>
				<div v-show="selectModule === 1" class="avatar-edit">
					<ChangeAvatarComponent />
				</div>
			</section>
		</div>
	</div>
</template>

<style scoped>
.personalization {
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	padding: 2rem;
	background: var(--glass-strong);
	border-radius: 26px;
	border: 1px solid var(--border-soft);
	box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
}

.personalization-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
}

.personalization-header h2 {
	margin: 0.3rem 0 0.4rem;
	font-size: 1.8rem;
	color: var(--title-color);
	font-family: 'Bahnschrift', 'Inter', sans-serif;
}

.eyebrow {
	margin: 0;
	font-size: 0.75rem;
	letter-spacing: 0.28rem;
	text-transform: uppercase;
	color: var(--text-secondary);
}

.sub {
	margin: 0;
	color: var(--text-secondary);
}

.tab-group {
	display: inline-flex;
	gap: 0.6rem;
	background: var(--surface-soft);
	padding: 0.3rem;
	border-radius: 999px;
	border: 1px solid var(--border-soft);
}

.tab {
	border: none;
	padding: 0.5rem 1.1rem;
	border-radius: 999px;
	background: transparent;
	color: var(--text-secondary);
	font-weight: 600;
	cursor: pointer;
}

.tab.active {
	background: var(--primary);
	color: var(--button-primary-text);
	box-shadow: 0 8px 18px rgba(37, 99, 235, 0.25);
}

.layout {
	display: grid;
	grid-template-columns: 1fr minmax(0, 0.9fr);
	gap: 2rem;
	align-items: start;
}

.preview {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	align-items: center;
	flex: 0 0 auto;
}

.preview h3 {
	margin: 0;
	font-size: 1.1rem;
	color: var(--title-color);
}

.preview-card {
	width: 100%;
	max-width: 520px;
	min-width: 420px;
	display: flex;
	justify-content: center;
	padding: 0.6rem;
	border-radius: 22px;
	background: var(--background-secondary);
	border: 1px solid var(--border-soft);
	box-shadow: var(--shadow-soft);
	overflow: visible;
}

.controls {
	background: var(--background-secondary);
	border-radius: 22px;
	padding: 1.6rem;
	border: 1px solid var(--border-soft);
	display: flex;
	flex-direction: column;
	gap: 1rem;
	min-width: 0;
	max-width: 520px;
	justify-self: end;
}

.customizationFatherContainer {
	max-height: calc(100vh - 220px);
	overflow: auto;
	padding-right: 0.4rem;
}

.btn-group {
	display: inline-flex;
	gap: 0.5rem;
	border-radius: 999px;
	background: var(--card-background);
	padding: 0.3rem;
	border: 1px solid var(--split);
}

.btn-group button {
	padding: 0.45rem 1rem;
	background: transparent;
	color: var(--text-secondary);
	font-weight: 600;
	border: none;
	cursor: pointer;
	border-radius: 999px;
}

.btn-group button.active {
	background: var(--primary-light);
	color: var(--title-color);
}

.avatar-edit {
	padding-top: 0.5rem;
}

@media (max-width: 960px) {
	.personalization {
		padding: 1.6rem;
	}

	.personalization-header {
		flex-direction: column;
		align-items: flex-start;
	}

	.layout {
		grid-template-columns: 1fr;
	}

	.controls {
		padding: 1.2rem;
	}
}

@media (max-width: 720px) {
	.preview-card {
		min-width: 0;
		max-width: 100%;
	}
}

</style>
