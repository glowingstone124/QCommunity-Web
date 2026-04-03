<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import HomeAnnouncementDialog from '@/components/home/HomeAnnouncementDialog.vue'
import HomeFeatureTile from '@/components/home/HomeFeatureTile.vue'
import HomeHeroSection from '@/components/home/HomeHeroSection.vue'
import { homeHeroStats, homeTiles } from '@/data/home'

const { t } = useI18n()
const dialogOpen = ref(false)

const localizedTiles = computed(() =>
	homeTiles.map((item) => ({
		...item,
		title: t(item.titleKey),
		description: t(item.descriptionKey),
	}))
)

function gotoWebsite() {
	window.location.href = 'https://qoriginal.vip'
}

function closeDialog() {
	dialogOpen.value = false
	sessionStorage.setItem('hasSeenDialog', 'true')
}

onMounted(() => {
	// if (!sessionStorage.getItem('hasSeenDialog')) {
	// 	dialogOpen.value = true
	// }
})
</script>

<template>
	<HomeAnnouncementDialog
		:model-value="dialogOpen"
		@visit="gotoWebsite"
		@close="closeDialog"
	/>

	<div class="home page-shell">
		<HomeHeroSection :stats="homeHeroStats" />

		<section class="tiles">
			<HomeFeatureTile
				v-for="item in localizedTiles"
				:key="item.to"
				:icon="item.icon"
				:title="item.title"
				:description="item.description"
				:to="item.to"
			/>
		</section>
	</div>
</template>

<style scoped>
.home {
	min-height: calc(100vh - var(--app-header-height));
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.tiles {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 1rem;
}
</style>
