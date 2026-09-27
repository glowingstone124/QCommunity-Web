<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { defaultGuideId, guideItems, guideSections } from '@/data/guides.js'
import CommandReference from '@/components/guides/CommandReference.vue'
import { loadGuideMarkdown } from '@/utils/guides.js'

const route = useRoute()
const router = useRouter()
const guide = ref(null)
const isLoading = ref(true)
const isGuideMenuOpen = ref(false)
const { t } = useI18n()

const localizedGuideSections = computed(() => guideSections.map((section) => ({
	...section,
	title: t(`guidesPage.section${section.key.charAt(0).toUpperCase()}${section.key.slice(1)}`),
	items: section.items.map((item) => ({
		...item,
		title: t(`guidesPage.guideTitles.${item.id}`),
	})),
})))

function guideTitle(item) {
	return item ? t(`guidesPage.guideTitles.${item.id}`) : ''
}

const activeId = computed(() => route.params.id || defaultGuideId)

const activeGuide = computed(() =>
	guideItems.find((item) => item.id === activeId.value) || null
)

const activeGuideIndex = computed(() =>
	guideItems.findIndex((item) => item.id === activeId.value)
)

const previousGuide = computed(() =>
	activeGuideIndex.value > 0 ? guideItems[activeGuideIndex.value - 1] : null
)

const nextGuide = computed(() =>
	activeGuideIndex.value >= 0 && activeGuideIndex.value < guideItems.length - 1
		? guideItems[activeGuideIndex.value + 1]
		: null
)

const isCommandReference = computed(() => activeId.value === 'commands')

function goToGuide(id) {
	isGuideMenuOpen.value = false
	router.push(`/guides/${id}`)
}

function openGuideLink(event) {
	const link = event.target.closest('a')

	if (!link) {
		return
	}

	const href = link.getAttribute('href')

	if (!href?.startsWith('/guides/')) {
		return
	}

	event.preventDefault()
	router.push(href)
}

async function syncGuide() {
	if (!route.params.id && defaultGuideId) {
		router.replace(`/guides/${defaultGuideId}`)
		return
	}

	isLoading.value = true

	if (isCommandReference.value) {
		guide.value = activeGuide.value
		isLoading.value = false
		return
	}

	guide.value = await loadGuideMarkdown(activeId.value)
	window.setTimeout(() => {
		isLoading.value = false
	}, 160)
}

onMounted(syncGuide)

watch(
	() => route.params.id,
	() => {
		syncGuide()
	}
)
</script>

<template>
	<main class="guides-page page-shell">
		<aside class="guides-sidebar" :aria-label="t('guidesPage.index')">
			<div class="guides-sidebar-heading">
				<h1>{{ t('guidesPage.title') }}</h1>
				<button
					type="button"
					class="guide-menu-toggle"
					:aria-expanded="isGuideMenuOpen"
					aria-controls="guide-nav-list"
					@click="isGuideMenuOpen = !isGuideMenuOpen"
				>
					{{ isGuideMenuOpen ? t('guidesPage.collapse') : t('guidesPage.expand') }}
				</button>
			</div>

			<nav id="guide-nav-list" class="guide-nav" :class="{ 'is-open': isGuideMenuOpen }">
				<section v-for="section in localizedGuideSections" :key="section.key" class="guide-section">
					<h2>{{ section.title }}</h2>
					<button
						v-for="item in section.items"
						:key="item.id"
						type="button"
						class="guide-nav-item"
						:class="{ 'is-active': item.id === activeId }"
						@click="goToGuide(item.id)"
					>
						<span>{{ item.title }}</span>
					</button>
				</section>
			</nav>
		</aside>

		<section class="guide-reader">
			<div class="guide-toolbar">
				<div>
					<strong>{{ guideTitle(activeGuide) || t('guidesPage.title') }}</strong>
				</div>

				<select
					:aria-label="t('guidesPage.select')"
					:value="activeId"
					@change="goToGuide($event.target.value)"
				>
					<optgroup
					v-for="section in localizedGuideSections"
						:key="section.key"
						:label="section.title"
					>
						<option
							v-for="item in section.items"
							:key="item.id"
							:value="item.id"
						>
							{{ item.title }}
						</option>
					</optgroup>
				</select>
			</div>

			<article v-if="isLoading" class="guide-article guide-article--loading" aria-busy="true">
				<div class="guide-skeleton guide-skeleton--kicker"></div>
				<div class="guide-skeleton guide-skeleton--title"></div>
				<div class="guide-skeleton guide-skeleton--text"></div>
				<div class="guide-skeleton guide-skeleton--text"></div>
				<div class="guide-skeleton guide-skeleton--short"></div>
			</article>

			<section v-else-if="!guide" class="guide-empty">
				<h2>{{ t('guidesPage.notFoundTitle') }}</h2>
				<p>{{ t('guidesPage.notFoundDescription') }}</p>
			</section>

			<CommandReference v-else-if="isCommandReference" />

			<article v-else class="guide-article">
				<header class="guide-header">
					<h1>{{ guideTitle(activeGuide) }}</h1>
				</header>

				<div class="guide-content" v-html="guide.html" @click="openGuideLink"></div>

				<footer class="guide-footer" :aria-label="t('guidesPage.pagination')">
					<button
						type="button"
						class="guide-pager"
						:disabled="!previousGuide"
						@click="previousGuide && goToGuide(previousGuide.id)"
					>
						<span>{{ t('guidesPage.previous') }}</span>
						<strong>{{ guideTitle(previousGuide) || t('guidesPage.first') }}</strong>
					</button>
					<button
						type="button"
						class="guide-pager guide-pager--next"
						:disabled="!nextGuide"
						@click="nextGuide && goToGuide(nextGuide.id)"
					>
						<span>{{ t('guidesPage.next') }}</span>
						<strong>{{ guideTitle(nextGuide) || t('guidesPage.last') }}</strong>
					</button>
				</footer>
			</article>
		</section>
	</main>
</template>

<style scoped src="./GuidesViewLayout.css"></style>
<style scoped src="./GuidesViewContent.css"></style>
