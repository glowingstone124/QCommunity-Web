<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue"
import ArtCard from "@/components/ArtCard.vue"
import AllCardsComponent from "@/components/AllCardsComponent.vue"
import MyCardsComponent from "@/components/MyCardsComponent.vue";
import ChangeAvatarComponent from "@/components/ChangeAvatarComponent.vue";

const selectedIndex = ref<0 | 1>(0)

const selectModule = ref(0)

const componentsList = [AllCardsComponent, MyCardsComponent]

const currentComponent = computed(() => componentsList[selectedIndex.value])

const viewportWidth = ref(typeof window === "undefined" ? 1200 : window.innerWidth)

const previewScale = computed(() => {
	if (viewportWidth.value <= 640) {
		return 0.2
	}

	if (viewportWidth.value <= 900) {
		return 0.28
	}

	return 0.66
})

const containerStyle = computed(() => ({
	"--card-scale": String(previewScale.value),
}))

function updateViewportWidth() {
	viewportWidth.value = window.innerWidth
}

onMounted(() => {
	updateViewportWidth()
	window.addEventListener("resize", updateViewportWidth)
})

onBeforeUnmount(() => {
	window.removeEventListener("resize", updateViewportWidth)
})
</script>

<template>
	<div class="container" :style="containerStyle">
		<section class="left">
			<div class="preview-panel">
				<div class="preview-copy">
					<p class="eyebrow">Personalization</p>
					<h1>您的卡面</h1>
					<p>左侧始终展示当前名片效果，右侧用于切换卡面和头像资源。</p>
				</div>
				<div class="card-stage">
					<div class="card-viewport">
						<ArtCard :scale="previewScale" id="1" />
					</div>
				</div>
			</div>
		</section>

		<section class="right">
			<header class="workspace-header">
				<div>
					<p class="workspace-eyebrow">Personalization</p>
					<h1 class="workspace-title">个性化</h1>
					<p class="workspace-sub">管理当前卡面、已获得卡片与头像资源。</p>
				</div>
				<div class="customizationSelect">
					<button type="button" class="customizationBtn" :class="{ active: selectModule === 0 }" @click="selectModule = 0">
						<p>卡面</p>
					</button>
					<button type="button" class="customizationBtn" :class="{ active: selectModule === 1 }" @click="selectModule = 1">
						<p>头像</p>
					</button>
				</div>
			</header>

			<section v-show="selectModule === 0" class="workspace-section customizationFatherContainer">
				<div class="section-topbar">
					<div class="section-copy">
						<h2>卡面库</h2>
						<p>切换查看全部卡片或你已获得的卡片。</p>
					</div>
					<div class="btn-group">
						<button :class="{ active: selectedIndex === 0 }" @click="selectedIndex = 0">
						所有卡片
						</button>
						<button :class="{ active: selectedIndex === 1 }" @click="selectedIndex = 1">
						我的卡片
						</button>
					</div>
				</div>
				<div class="section-body">
					<component :is="currentComponent"/>
				</div>
			</section>

			<section v-show="selectModule === 1" class="workspace-section avatar-panel">
				<div class="section-topbar">
					<div class="section-copy">
						<h2>头像库</h2>
						<p>选择一个头像并保存，预览会在下次拉取数据后更新。</p>
					</div>
				</div>
				<div class="avatar-edit">
					<ChangeAvatarComponent />
				</div>
			</section>
		</section>
	</div>
</template>

<style scoped>
.container {
	--card-width: calc(700px * var(--card-scale));
	--card-height: calc(1000px * var(--card-scale));
	display: grid;
	grid-template-columns: minmax(420px, 500px) minmax(0, 1fr);
	align-items: stretch;
	gap: 1rem;
	height: 100%;
	min-height: 0;
	max-width: 100%;
	overflow: hidden;
}

.left,
.right {
	min-width: 0;
	max-width: 100%;
}

.preview-panel,
.right {
	background: var(--glass-strong);
	border: 1px solid var(--border-soft);
	border-radius: 8px;
	box-shadow: none;
}

.preview-panel {
	height: 100%;
	max-width: 100%;
	padding: 1rem;
	display: grid;
	grid-template-rows: auto minmax(0, 1fr);
	gap: 0.75rem;
	box-sizing: border-box;
	overflow: hidden;
}

.preview-copy {
	display: grid;
	gap: 0.4rem;
}

.eyebrow {
	margin: 0;
	font-size: 0.78rem;
	letter-spacing: 0;
	text-transform: uppercase;
	color: var(--text-secondary);
	font-weight: 700;
}

.preview-copy h1 {
	margin: 0;
	font-size: 1.45rem;
	color: var(--title-color);
	line-height: 1.2;
}

.preview-copy p {
	margin: 0;
	color: var(--text-secondary);
	line-height: 1.6;
	text-align: left;
}

.card-stage {
	display: flex;
	justify-content: flex-start;
	align-items: center;
	max-width: 100%;
	min-height: 0;
}

.card-viewport {
	width: min(var(--card-width), 100%);
	height: min(var(--card-height), calc(100dvh - 250px));
	display: flex;
	justify-content: flex-start;
	align-items: flex-start;
	overflow: hidden;
}

.card-stage :deep(.wrapper) {
	margin: 0;
}

.customizationFatherContainer{
	height: 100%;
	overflow: hidden;
	display: grid;
	grid-template-rows: auto minmax(0, 1fr);
	gap: 1rem;
	min-height: 0;
}

.right {
	width: 100%;
	padding: 1rem;
	box-sizing: border-box;
	display: grid;
	grid-template-rows: auto minmax(0, 1fr);
	gap: 1rem;
	min-height: 0;
	overflow: hidden;
}

.workspace-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;
}

.workspace-eyebrow {
	margin: 0 0 0.35rem;
	font-size: 0.75rem;
	color: var(--text-secondary);
	font-weight: 700;
	text-transform: uppercase;
}

.workspace-title {
	margin: 0 0 0.4rem;
	font-size: 1.45rem;
	line-height: 1.2;
	color: var(--title-color);
}

.workspace-sub {
	margin: 0;
	color: var(--text-secondary);
	line-height: 1.5;
}

.customizationSelect{
	background-color: var(--surface-soft);
	border: 1px solid var(--border-soft);
	display: flex;
	justify-content: center;
	border-radius: 6px;
	padding: 0.25rem;
	gap: 0.25rem;
}

.customizationBtn{
	background-color: transparent;
	width: 100%;
	align-content: center;
	padding: 0.65rem 1rem;
	border-radius: 4px;
	border: none;
	cursor: pointer;
	transition: background-color 0.18s ease;
}

.customizationBtn.active,
.customizationBtn:hover{
	background-color: var(--glass-strong);
}

.customizationBtn p {
	color: var(--text-main);
	margin: 0;
	text-align: center;
	font-weight: 600;
}

.section-topbar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 1rem;
	flex-wrap: wrap;
}

.section-copy {
	display: grid;
	gap: 0.3rem;
}

.section-copy h2 {
	margin: 0;
	font-size: 1.1rem;
	color: var(--title-color);
}

.section-copy p {
	margin: 0;
	color: var(--text-secondary);
	line-height: 1.5;
}

.btn-group {
	display: inline-flex;
	width: fit-content;
	border-radius: 6px;
	background: var(--surface-soft);
	border: 1px solid var(--border-soft);
	padding: 4px;
	overflow: hidden;
}

.btn-group button {
	position: relative;
	z-index: 1;
	padding: 8px 16px;
	background: transparent;
	color: var(--text-secondary);
	font-weight: bold;
	border: none;
	cursor: pointer;
	border-radius: 4px;
	transition:
		background-color 0.18s ease,
		color 0.18s ease;
	min-width: 100px;
}

.btn-group button.active {
	background: var(--glass-strong);
	color: var(--text-main);
}

.workspace-section {
	background: var(--glass-strong);
	border: 1px solid var(--border-soft);
	border-radius: 8px;
	padding: 1rem;
	height: 100%;
	min-height: 0;
	overflow: auto;
}

.section-body {
	min-height: 0;
	overflow: auto;
}

.avatar-panel {
	display: grid;
	grid-template-rows: auto minmax(0, 1fr);
	gap: 1rem;
}

.avatar-edit {
	min-width: 0;
}

@media (max-width: 900px) {
	.container {
		grid-template-columns: 1fr;
		grid-template-rows: auto auto;
		gap: 1rem;
		height: auto;
		min-height: auto;
		overflow: visible;
	}

	.left {
		display: block;
	}

	.preview-panel {
		height: auto;
		padding: 0.9rem 1rem;
		grid-template-columns: minmax(0, 1fr) auto;
		grid-template-rows: auto;
		align-items: center;
		gap: 1rem;
		overflow: visible;
	}

	.preview-copy p {
		display: none;
	}

	.preview-copy h1 {
		font-size: 1.7rem;
	}

	.card-viewport {
		width: var(--card-width);
		height: var(--card-height);
		max-height: none;
	}

	.right {
		width: 100%;
		min-width: 0;
		min-height: auto;
		grid-template-rows: auto auto;
		overflow: visible;
	}

	.workspace-header {
		flex-direction: column;
	}

	.customizationSelect {
		flex-direction: row;
		width: 100%;
	}

	.btn-group {
		width: 100%;
		justify-content: stretch;
	}

	.btn-group button {
		flex: 1;
		min-width: 0;
	}

	.customizationFatherContainer {
		height: auto;
		overflow: visible;
		grid-template-rows: auto auto;
	}

	.section-body,
	.avatar-panel {
		height: auto;
		max-height: none;
		overflow: visible;
	}
}

@media (max-width: 640px) {
	.right,
	.preview-panel,
	.workspace-section {
		padding: 0.9rem;
		border-radius: 8px;
	}

	.section-topbar {
		flex-direction: column;
		align-items: stretch;
	}

	.customizationSelect {
		width: 100%;
	}

	.customizationBtn {
		padding: 0.6rem 0.75rem;
	}

	.card-viewport {
		width: var(--card-width);
		height: var(--card-height);
	}

	.preview-copy p,
	.section-copy p {
		display: none;
	}

	.preview-copy {
		gap: 0.2rem;
	}

	.preview-copy h1 {
		font-size: 1.3rem;
	}

	.right-header {
		position: static;
		padding-bottom: 0;
	}

	.customizationSelect {
		padding: 0.2rem;
		gap: 0.25rem;
	}

	.customizationBtn {
		padding: 0.7rem 0.85rem;
	}

	.customizationBtn p {
		font-size: 0.95rem;
	}

	.section-topbar {
		gap: 0.75rem;
	}

	.section-copy h2 {
		font-size: 1.2rem;
	}

	.btn-group {
		padding: 3px;
	}

	.btn-group button {
		padding: 0.65rem 0.75rem;
		font-size: 0.9rem;
	}
}
</style>
