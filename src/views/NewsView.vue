<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { loadNewsFeed } from '@/utils/newsFeed'

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
const newsItems = ref([])
const isLoading = ref(true)
const isNewsMenuOpen = ref(false)

const article = computed(() => {
	const id = route.params.id || newsItems.value[0]?.id
	return newsItems.value.find((item) => item.id === id) || null
})

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
	<main class="news-page page-shell">
		<aside class="news-sidebar" :aria-label="t('newsPage.sidebar_label')">
			<div class="news-sidebar-heading">
				<h1>{{ t('newsPage.title') }}</h1>
				<button
					type="button"
					class="news-menu-toggle"
					:aria-expanded="isNewsMenuOpen"
					aria-controls="news-nav-list"
					@click="isNewsMenuOpen = !isNewsMenuOpen"
				>
					{{ isNewsMenuOpen ? t('newsPage.collapse') : t('newsPage.show_list') }}
				</button>
			</div>

			<nav id="news-nav-list" class="news-nav" :class="{ 'is-open': isNewsMenuOpen }">
				<button
					v-for="item in localizedNewsItems"
					:key="item.id"
					type="button"
					class="news-nav-item"
					:class="{ 'is-active': item.id === article?.id }"
					@click="goToArticle(item.id)"
				>
					<span class="news-nav-meta">
						<span>{{ item.type }}</span>
						<time :datetime="item.date">{{ item.date }}</time>
					</span>
					<strong>{{ item.title }}</strong>
				</button>
			</nav>
		</aside>

		<section class="news-reader">
			<article v-if="isLoading" class="article-shell" aria-busy="true" aria-live="polite">
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

			<section v-else-if="!localizedArticle" class="empty-state">
				<p>{{ t('newsPage.not_found') }}</p>
				<router-link class="back-link" to="/">{{ t('newsPage.back_home') }}</router-link>
			</section>

			<article v-else class="article-shell">
				<header class="article-header">
					<div class="article-meta">
						<span>{{ localizedArticle.type }}</span>
						<time :datetime="localizedArticle.date">{{ localizedArticle.date }}</time>
					</div>
					<h1>{{ localizedArticle.title }}</h1>
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
						<ul v-else-if="block.type === 'list'">
							<li v-for="item in block.items" :key="item">{{ item }}</li>
						</ul>
						<p v-else>{{ block.text }}</p>
					</template>
					<p v-if="!localizedArticle.body.length">{{ t('newsPage.no_body') }}</p>
				</div>

				<footer class="article-footer">
					<router-link class="back-link" to="/">{{ t('newsPage.back_feed') }}</router-link>
				</footer>
			</article>
		</section>
	</main>
</template>

<style scoped>
.news-page {
	min-height: 100%;
	display: grid;
	grid-template-columns: minmax(260px, 340px) minmax(0, 1fr);
	gap: clamp(1.25rem, 3vw, 2.5rem);
	background: var(--page-background);
	color: var(--text-main);
	overflow: auto;
	padding: clamp(1rem, 4vw, 3rem);
}

.news-sidebar {
	position: sticky;
	top: 1rem;
	align-self: start;
	max-height: calc(100dvh - var(--app-header-height) - 2rem);
	overflow: auto;
	border-right: 1px solid var(--split);
	padding-right: 1rem;
}

.news-sidebar-heading {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.35rem;
	margin-bottom: 1.25rem;
}

.news-sidebar-heading h1 {
	margin: 0;
	color: var(--title-color);
	font-size: 1.7rem;
	line-height: 1.1;
	letter-spacing: 0;
}

.news-menu-toggle {
	display: none;
	border: 1px solid var(--split);
	background: var(--background);
	color: var(--text-main);
	padding: 0.55rem 0.75rem;
	font-size: 0.86rem;
	font-weight: 720;
	cursor: pointer;
}

.news-menu-toggle:hover,
.news-menu-toggle:focus-visible {
	border-color: var(--primary);
	outline: none;
}

.news-nav {
	display: grid;
	gap: 0.6rem;
}

.news-nav-item {
	width: 100%;
	display: grid;
	gap: 0.42rem;
	border: 1px solid transparent;
	border-left-color: var(--split);
	background: transparent;
	color: var(--text-main);
	text-align: left;
	padding: 0.78rem 0.85rem;
	cursor: pointer;
}

.news-nav-item:hover,
.news-nav-item:focus-visible,
.news-nav-item.is-active {
	border-left-color: var(--primary);
	background: var(--background);
	outline: none;
	transform: translateX(3px);
}

.news-nav-meta {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	color: var(--text-secondary);
	font-size: 0.76rem;
	font-weight: 720;
	line-height: 1.2;
}

.news-nav-meta span {
	color: var(--primary);
}

.news-nav-item strong {
	color: var(--title-color);
	font-size: 0.98rem;
	line-height: 1.28;
}

.news-reader {
	min-width: 0;
}

.article-shell,
.empty-state {
	width: min(900px, 100%);
	box-sizing: border-box;
}

.article-shell {
	display: grid;
	gap: clamp(1.5rem, 4vw, 2.5rem);
	padding: clamp(1.25rem, 4vw, 3rem) 0 clamp(3rem, 8vw, 5rem);
}

.article-header {
	display: grid;
	gap: 0.95rem;
}

.article-meta {
	display: inline-flex;
	align-items: center;
	gap: 0.75rem;
	color: var(--text-secondary);
	font-size: 0.86rem;
	font-weight: 760;
}

.article-meta span {
	color: var(--primary);
}

.article-meta span::after {
	content: "/";
	margin-left: 0.75rem;
	color: var(--text-secondary);
	font-weight: 400;
}

.article-header h1 {
	margin: 0;
	color: var(--title-color);
	font-size: clamp(2rem, 6vw, 4.8rem);
	font-weight: 680;
	line-height: 1.05;
	letter-spacing: 0;
}

.article-image,
.skeleton-media {
	width: 100%;
	aspect-ratio: 16 / 9;
	display: block;
	object-fit: cover;
	background: var(--card-background);
	border: 1px solid color-mix(in srgb, var(--text-main) 12%, transparent);
	box-sizing: border-box;
}

.article-body {
	display: grid;
	gap: 1.15rem;
	max-width: 760px;
}

.article-body p {
	margin: 0;
	color: var(--text-main);
	font-size: clamp(1rem, 1.25vw, 1.12rem);
	line-height: 1.82;
	overflow-wrap: anywhere;
}

.article-body h2,
.article-body h3 {
	margin: 0;
	color: var(--title-color);
	line-height: 1.25;
	letter-spacing: 0;
}

.article-body h2 {
	font-size: clamp(1.35rem, 2.2vw, 1.85rem);
}

.article-body h3 {
	font-size: clamp(1.15rem, 1.7vw, 1.35rem);
}

.article-body ul {
	display: grid;
	gap: 0.45rem;
	margin: 0;
	padding-left: 1.25rem;
	color: var(--text-main);
	line-height: 1.7;
}

.article-body li {
	padding-left: 0.25rem;
}

.article-footer {
	padding-top: 0.5rem;
}

.back-link {
	display: inline-flex;
	align-items: center;
	color: var(--primary);
	font-weight: 720;
	text-decoration: none;
}

.back-link:hover {
	color: var(--primary-dark);
}

.empty-state {
	min-height: calc(100dvh - var(--app-header-height, 0px) - 6rem);
	display: grid;
	place-content: center;
	justify-items: center;
	gap: 1rem;
	text-align: center;
}

.empty-state p {
	margin: 0;
	color: var(--text-secondary);
	font-size: 1rem;
}

.skeleton-line,
.skeleton-media {
	position: relative;
	overflow: hidden;
	background: color-mix(in srgb, var(--text-main) 10%, transparent);
}

.skeleton-line {
	display: block;
	height: 1rem;
	width: 100%;
}

.skeleton-line--meta {
	width: 180px;
	height: 0.9rem;
}

.skeleton-line--title {
	width: min(760px, 100%);
	height: clamp(2.6rem, 6vw, 4.8rem);
}

.skeleton-line--title-short {
	width: min(520px, 76%);
	height: clamp(2.6rem, 6vw, 4.8rem);
}

.skeleton-line--short {
	width: 64%;
}

.skeleton-paragraph {
	display: grid;
	gap: 0.65rem;
}

.skeleton-line::after,
.skeleton-media::after {
	content: "";
	position: absolute;
	inset: 0;
	background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--background) 42%, transparent), transparent);
	transform: translateX(-100%);
	animation: skeleton-shimmer 1.35s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
	to {
		transform: translateX(100%);
	}
}

@media (max-width: 640px) {
	.news-page {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1rem;
	}

	.news-sidebar {
		width: 100%;
		position: static;
		max-height: none;
		overflow: visible;
		border-right: none;
		border-bottom: 1px solid var(--split);
		padding-right: 0;
		padding-bottom: 1rem;
	}

	.news-sidebar-heading {
		margin-bottom: 0;
	}

	.news-menu-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.news-nav {
		display: none;
		margin-top: 1rem;
	}

	.news-nav.is-open {
		display: grid;
		position: static;
		overflow: visible;
	}

	.news-nav-item {
		min-width: 0;
	}

	.news-nav-item:hover,
	.news-nav-item:focus-visible,
	.news-nav-item.is-active {
		transform: none;
	}

	.news-reader {
		width: 100%;
	}

	.article-shell {
		padding-top: 1rem;
	}
}

@media (prefers-reduced-motion: reduce) {
	.skeleton-line::after,
	.skeleton-media::after {
		animation: none;
	}
}
</style>
