<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue"
import { useI18n } from 'vue-i18n'
import ArtCard from "@/components/ArtCard.vue"
import AllCardsComponent from "@/components/AllCardsComponent.vue"
import MyCardsComponent from "@/components/MyCardsComponent.vue";
import ChangeAvatarComponent from "@/components/ChangeAvatarComponent.vue";

const selectedIndex = ref<0 | 1>(0)
const { t } = useI18n()

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
					<h1>{{ t('cardsPage.previewTitle') }}</h1>
					<p>{{ t('cardsPage.previewDescription') }}</p>
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
					<h1 class="workspace-title">{{ t('cardsPage.personalization') }}</h1>
					<p class="workspace-sub">{{ t('cardsPage.personalizationDescription') }}</p>
				</div>
				<div class="customizationSelect">
					<button type="button" class="customizationBtn" :class="{ active: selectModule === 0 }" @click="selectModule = 0">
						<p>{{ t('cardsPage.card') }}</p>
					</button>
					<button type="button" class="customizationBtn" :class="{ active: selectModule === 1 }" @click="selectModule = 1">
						<p>{{ t('cardsPage.avatar') }}</p>
					</button>
				</div>
			</header>

			<section v-show="selectModule === 0" class="workspace-section customizationFatherContainer">
				<div class="section-topbar">
					<div class="section-copy">
						<h2>{{ t('cardsPage.library') }}</h2>
						<p>{{ t('cardsPage.libraryDescription') }}</p>
					</div>
					<div class="btn-group">
						<button :class="{ active: selectedIndex === 0 }" @click="selectedIndex = 0">
						{{ t('cardsPage.allCards') }}
						</button>
						<button :class="{ active: selectedIndex === 1 }" @click="selectedIndex = 1">
						{{ t('cardsPage.myCards') }}
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
						<h2>{{ t('cardsPage.avatarLibrary') }}</h2>
						<p>{{ t('cardsPage.avatarDescription') }}</p>
					</div>
				</div>
				<div class="avatar-edit">
					<ChangeAvatarComponent />
				</div>
			</section>
		</section>
	</div>
</template>

<style scoped src="./PlayerCardsListComponent.css"></style>
