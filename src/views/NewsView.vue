<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { loadNewsFeed } from '@/utils/newsFeed'
import UiDocLayout from '@/components/ui/UiDocLayout.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiStatePanel from '@/components/ui/UiStatePanel.vue'
import { useUiPreferences } from '@/composables/useUiPreferences.js'

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
const { isModernUi } = useUiPreferences()
const newsItems = ref([])
const isLoading = ref(true)
const isNewsMenuOpen = ref(false)

const article = computed(() => {
	const id = route.params.id || newsItems.value[0]?.id
	return newsItems.value.find((item) => item.id === id) || null
})

const isCollapseArticle = computed(() =>
	route.params.id === '2026collapse' || article.value?.id === '2026collapse'
)

const localizedArticle = computed(() => {
	if (!article.value) {
		return null
	}

	return {
		...article.value,
		type: article.value.type[locale.value] || article.value.type.zh,
		title: article.value.title[locale.value] || article.value.title.zh,
		body: article.value.body?.[locale.value] || article.value.body?.zh || [],
	}
})

const localizedNewsItems = computed(() =>
	newsItems.value.map((item) => ({
		...item,
		type: item.type[locale.value] || item.type.zh,
		title: item.title[locale.value] || item.title.zh,
	}))
)

function resolveRoute() {
	if (!route.params.id && newsItems.value[0]?.id) {
		router.replace(`/news/${newsItems.value[0].id}`)
	}
}

function goToArticle(id) {
	isNewsMenuOpen.value = false
	router.push(`/news/${id}`)
}

async function syncArticle() {
	isLoading.value = true
	newsItems.value = await loadNewsFeed()
	resolveRoute()
	window.setTimeout(() => {
		isLoading.value = false
	}, 220)
}

onMounted(() => {
	syncArticle()
})

watch(
	() => route.params.id,
	() => {
		isNewsMenuOpen.value = false
	}
)
</script>

<template>
	<div v-if="isCollapseArticle" class="news-page news-page--collapse page-shell">
		<section class="news-reader news-reader--collapse">
			<article
				v-if="isLoading"
				class="article-shell article-shell--collapse"
				aria-busy="true"
				aria-live="polite"
			>
				<div class="article-meta skeleton-line skeleton-line--meta"></div>
				<div class="skeleton-line skeleton-line--title"></div>
				<div class="skeleton-line skeleton-line--title-short"></div>
				<div class="skeleton-media"></div>
				<div class="article-body">
					<div v-for="item in 4" :key="item" class="skeleton-paragraph">
						<span class="skeleton-line"></span>
						<span class="skeleton-line"></span>
						<span class="skeleton-line skeleton-line--short"></span>
					</div>
				</div>
			</article>

			<UiStatePanel
				v-else-if="!localizedArticle"
				state="empty"
				icon="newspaper"
				:title="t('newsPage.not_found')"
				:action-label="t('newsPage.back_home')"
				action-to="/"
			/>

			<article v-else class="article-shell article-shell--collapse">
				<header class="article-header">
					<h1>{{ localizedArticle.title }}</h1>
					<div class="article-meta">
						<span>{{ localizedArticle.type }}</span>
						<time :datetime="localizedArticle.date">{{ localizedArticle.date }}</time>
					</div>
				</header>

				<img
					v-if="localizedArticle.image"
					class="article-image"
					:src="localizedArticle.image"
					:alt="localizedArticle.title"
				>

				<div class="article-body">
					<template v-for="(block, index) in localizedArticle.body" :key="index">
						<h2 v-if="block.type === 'heading'">{{ block.text }}</h2>
						<h3 v-else-if="block.type === 'subheading'">{{ block.text }}</h3>
						<figure v-else-if="block.type === 'image'" class="article-body-image">
							<img :src="block.src" :alt="block.alt" loading="lazy" decoding="async">
							<figcaption v-if="block.alt">{{ block.alt }}</figcaption>
						</figure>
						<div v-else-if="block.type === 'table'" class="article-table-wrap">
							<table>
								<thead>
									<tr>
										<th
											v-for="(header, cellIndex) in block.headers"
											:key="cellIndex"
											:style="{ textAlign: block.alignments[cellIndex] }"
										>
											{{ header }}
										</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="(row, rowIndex) in block.rows" :key="rowIndex">
										<td
											v-for="(cell, cellIndex) in row"
											:key="cellIndex"
											:style="{ textAlign: block.alignments[cellIndex] }"
										>
											{{ cell }}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
						<ul v-else-if="block.type === 'list'">
							<li v-for="item in block.items" :key="item">{{ item }}</li>
						</ul>
						<p v-else>{{ block.text }}</p>
					</template>
					<p v-if="!localizedArticle.body.length">{{ t('newsPage.no_body') }}</p>
				</div>

				<footer class="article-footer">
					<router-link class="back-link" to="/">
						<span>{{ t('newsPage.back_feed') }}</span>
					</router-link>
				</footer>
			</article>
		</section>
	</div>

	<UiDocLayout
		v-else
		class="news-page news-doc-page"
		:nav-label="t('newsPage.sidebar_label')"
	>
		<template #sidebar-header>
			<div class="news-sidebar-heading">
				<h1 v-if="isLoading || !localizedArticle">{{ t('newsPage.title') }}</h1>
				<p v-else class="news-sidebar-title">{{ t('newsPage.title') }}</p>
				<UiButton
					class="news-menu-toggle"
					variant="tonal"
					size="sm"
					:icon="isNewsMenuOpen ? 'close' : 'menu'"
					:aria-expanded="isNewsMenuOpen"
					aria-controls="news-nav-list"
					@click="isNewsMenuOpen = !isNewsMenuOpen"
				>
					{{ isNewsMenuOpen ? t('newsPage.collapse') : t('newsPage.show_list') }}
				</UiButton>
			</div>
		</template>

		<template #sidebar>
			<div id="news-nav-list" class="news-nav" :class="{ 'is-open': isNewsMenuOpen }">
				<button
					v-for="item in localizedNewsItems"
					:key="item.id"
					type="button"
					class="ui-doc-nav-item news-nav-item"
					:class="{ 'is-active': item.id === article?.id }"
					:aria-current="item.id === article?.id ? 'page' : undefined"
					@click="goToArticle(item.id)"
				>
					<md-ripple v-if="isModernUi" />
					<span class="news-nav-meta">
						<span>{{ item.type }}</span>
						<time :datetime="item.date">{{ item.date }}</time>
					</span>
					<strong>{{ item.title }}</strong>
				</button>
			</div>
		</template>

		<article
			v-if="isLoading"
			class="article-shell"
			aria-busy="true"
			aria-live="polite"
		>
			<div class="article-meta skeleton-line skeleton-line--meta"></div>
			<div class="skeleton-line skeleton-line--title"></div>
			<div class="skeleton-line skeleton-line--title-short"></div>
			<div class="skeleton-media"></div>
			<div class="article-body">
				<div v-for="item in 4" :key="item" class="skeleton-paragraph">
					<span class="skeleton-line"></span>
					<span class="skeleton-line"></span>
					<span class="skeleton-line skeleton-line--short"></span>
				</div>
			</div>
		</article>

		<UiStatePanel
			v-else-if="!localizedArticle"
			state="empty"
			icon="newspaper"
			:title="t('newsPage.not_found')"
			:action-label="t('newsPage.back_home')"
			action-to="/"
		/>

		<article v-else class="article-shell">
			<header class="article-header">
				<h1>{{ localizedArticle.title }}</h1>
				<div class="article-meta">
					<span>{{ localizedArticle.type }}</span>
					<time :datetime="localizedArticle.date">{{ localizedArticle.date }}</time>
				</div>
			</header>

			<img
				v-if="localizedArticle.image"
				class="article-image"
				:src="localizedArticle.image"
				:alt="localizedArticle.title"
			>

			<div class="article-body">
				<template v-for="(block, index) in localizedArticle.body" :key="index">
					<h2 v-if="block.type === 'heading'">{{ block.text }}</h2>
					<h3 v-else-if="block.type === 'subheading'">{{ block.text }}</h3>
					<figure v-else-if="block.type === 'image'" class="article-body-image">
						<img :src="block.src" :alt="block.alt" loading="lazy" decoding="async">
						<figcaption v-if="block.alt">{{ block.alt }}</figcaption>
					</figure>
					<div v-else-if="block.type === 'table'" class="article-table-wrap">
						<table>
							<thead>
								<tr>
									<th
										v-for="(header, cellIndex) in block.headers"
										:key="cellIndex"
										:style="{ textAlign: block.alignments[cellIndex] }"
									>
										{{ header }}
									</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="(row, rowIndex) in block.rows" :key="rowIndex">
									<td
										v-for="(cell, cellIndex) in row"
										:key="cellIndex"
										:style="{ textAlign: block.alignments[cellIndex] }"
									>
										{{ cell }}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
					<ul v-else-if="block.type === 'list'">
						<li v-for="item in block.items" :key="item">{{ item }}</li>
					</ul>
					<p v-else>{{ block.text }}</p>
				</template>
				<p v-if="!localizedArticle.body.length">{{ t('newsPage.no_body') }}</p>
			</div>

			<footer class="article-footer">
				<UiButton variant="tonal" icon="arrow_back" to="/">{{ t('newsPage.back_feed') }}</UiButton>
			</footer>
		</article>
	</UiDocLayout>
</template>

<style scoped src="./styles/news/page.css"></style>
<style scoped src="./styles/news/article.css"></style>
<style scoped src="./styles/news/responsive.css"></style>
