<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { defaultGuideId, guideItems, guideSections } from '@/data/guides.js'
import CommandReference from '@/components/guides/CommandReference.vue'
import { loadGuideMarkdown } from '@/utils/guides.js'

const route = useRoute()
const router = useRouter()
const guide = ref(null)
const isLoading = ref(true)
const isGuideMenuOpen = ref(false)

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
		<aside class="guides-sidebar" aria-label="指南目录">
			<div class="guides-sidebar-heading">
				<h1>指南</h1>
				<button
					type="button"
					class="guide-menu-toggle"
					:aria-expanded="isGuideMenuOpen"
					aria-controls="guide-nav-list"
					@click="isGuideMenuOpen = !isGuideMenuOpen"
				>
					{{ isGuideMenuOpen ? '收起' : '展开目录' }}
				</button>
			</div>

			<nav id="guide-nav-list" class="guide-nav" :class="{ 'is-open': isGuideMenuOpen }">
				<section v-for="section in guideSections" :key="section.key" class="guide-section">
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
						<small>{{ item.description }}</small>
					</button>
				</section>
			</nav>
		</aside>

		<section class="guide-reader">
			<div class="guide-toolbar">
				<div>
					<strong>{{ activeGuide?.title || '指南' }}</strong>
				</div>

				<select
					aria-label="选择指南"
					:value="activeId"
					@change="goToGuide($event.target.value)"
				>
					<optgroup
						v-for="section in guideSections"
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
				<h2>没有找到这篇指南</h2>
				<p>请选择左侧目录中的其他文章。</p>
			</section>

			<CommandReference v-else-if="isCommandReference" />

			<article v-else class="guide-article">
				<header class="guide-header">
					<h1>{{ guide.title }}</h1>
					<p>{{ guide.description }}</p>
				</header>

				<div class="guide-content" v-html="guide.html" @click="openGuideLink"></div>

				<footer class="guide-footer" aria-label="指南翻页">
					<button
						type="button"
						class="guide-pager"
						:disabled="!previousGuide"
						@click="previousGuide && goToGuide(previousGuide.id)"
					>
						<span>Previous</span>
						<strong>{{ previousGuide?.title || '已经是第一篇' }}</strong>
					</button>
					<button
						type="button"
						class="guide-pager guide-pager--next"
						:disabled="!nextGuide"
						@click="nextGuide && goToGuide(nextGuide.id)"
					>
						<span>Next</span>
						<strong>{{ nextGuide?.title || '已经是最后一篇' }}</strong>
					</button>
				</footer>
			</article>
		</section>
	</main>
</template>

<style scoped>
.guides-page {
	min-height: 100%;
	display: grid;
	grid-template-columns: minmax(260px, 340px) minmax(0, 1fr);
	gap: clamp(1.25rem, 3vw, 2.5rem);
	padding: clamp(1rem, 3vw, 2.5rem);
	background: var(--page-background);
	color: var(--text-main);
	overflow: auto;
}

.guides-sidebar {
	position: sticky;
	top: 1rem;
	align-self: start;
	max-height: calc(100dvh - var(--app-header-height) - 2rem);
	overflow: auto;
	border-right: 1px solid var(--split);
	padding-right: 1rem;
}

.guides-sidebar-heading {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.35rem;
	margin-bottom: 1.25rem;
}

.guides-sidebar-heading h1,
.guide-header h1,
.guide-section h2,
.guide-empty h2 {
	margin: 0;
	color: var(--title-color);
	letter-spacing: 0;
}

.guides-sidebar-heading h1 {
	font-size: 1.7rem;
	line-height: 1.1;
}

.guide-menu-toggle {
	display: none;
	border: 1px solid var(--split);
	background: var(--background);
	color: var(--text-main);
	padding: 0.55rem 0.75rem;
	font-size: 0.86rem;
	font-weight: 720;
	cursor: pointer;
}

.guide-menu-toggle:hover,
.guide-menu-toggle:focus-visible {
	border-color: var(--primary);
	outline: none;
}

.guide-nav {
	display: grid;
	gap: 1.35rem;
}

.guide-section {
	display: grid;
	gap: 0.45rem;
}

.guide-section h2 {
	font-size: 0.9rem;
	color: var(--text-secondary);
	font-weight: 740;
}

.guide-nav-item {
	width: 100%;
	border: 1px solid transparent;
	border-left-color: var(--split);
	background: transparent;
	color: var(--text-main);
	display: grid;
	gap: 0.28rem;
	text-align: left;
	padding: 0.72rem 0.8rem;
	cursor: pointer;
}

.guide-nav-item:hover,
.guide-nav-item:focus-visible,
.guide-nav-item.is-active {
	border-left-color: var(--primary);
	background: var(--background);
	outline: none;
	transform: translateX(3px);
}

.guide-nav-item span {
	font-size: 0.96rem;
	font-weight: 720;
	line-height: 1.25;
}

.guide-nav-item small {
	color: var(--text-secondary);
	font-size: 0.82rem;
	line-height: 1.42;
}

.guide-reader {
	min-width: 0;
}

.guide-toolbar {
	display: none;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	margin-bottom: 1.25rem;
	border-bottom: 1px solid var(--split);
	padding-bottom: 1rem;
}

.guide-toolbar div {
	min-width: 0;
	display: grid;
	gap: 0.25rem;
}

.guide-footer span {
	color: var(--primary);
	font-size: 0.76rem;
	font-weight: 760;
	text-transform: uppercase;
	letter-spacing: 0;
}

.guide-toolbar strong {
	color: var(--title-color);
	font-size: 1rem;
	line-height: 1.3;
	overflow-wrap: anywhere;
}

.guide-toolbar select {
	max-width: min(100%, 18rem);
	border: 1px solid var(--split);
	background: var(--background);
	color: var(--text-main);
	padding: 0.65rem 0.8rem;
	outline: none;
}

.guide-toolbar select:focus-visible {
	border-color: var(--primary);
}

.guide-article,
.guide-empty {
	width: min(900px, 100%);
	padding-bottom: 5rem;
}

.guide-header {
	display: grid;
	gap: 0.8rem;
	margin-bottom: clamp(1.5rem, 4vw, 2.6rem);
}

.guide-header h1 {
	font-size: clamp(2rem, 5vw, 4.2rem);
	font-weight: 680;
	line-height: 1.04;
}

.guide-header p,
.guide-empty p {
	max-width: 720px;
	margin: 0;
	color: var(--text-secondary);
	font-size: clamp(1rem, 2vw, 1.18rem);
	line-height: 1.65;
}

.guide-content {
	display: grid;
	gap: 1rem;
	max-width: 820px;
}

.guide-content :deep(h1),
.guide-content :deep(h2),
.guide-content :deep(h3),
.guide-content :deep(h4) {
	margin: 0.65rem 0 0;
	color: var(--title-color);
	line-height: 1.24;
	letter-spacing: 0;
}

.guide-content :deep(h1) {
	font-size: clamp(1.7rem, 3vw, 2.45rem);
}

.guide-content :deep(h2) {
	font-size: clamp(1.35rem, 2.2vw, 1.8rem);
}

.guide-content :deep(h3) {
	font-size: clamp(1.12rem, 1.7vw, 1.34rem);
}

.guide-content :deep(p),
.guide-content :deep(li),
.guide-content :deep(blockquote) {
	font-size: 1rem;
	line-height: 1.82;
}

.guide-content :deep(p) {
	margin: 0;
	color: var(--text-main);
	overflow-wrap: anywhere;
}

.guide-content :deep(ul) {
	display: grid;
	gap: 0.42rem;
	margin: 0;
	padding-left: 1.25rem;
}

.guide-content :deep(a) {
	color: var(--primary);
	font-weight: 680;
	text-decoration: none;
	border-bottom: 1px solid color-mix(in srgb, var(--primary) 34%, transparent);
}

.guide-content :deep(a:hover) {
	color: var(--primary-dark);
	border-bottom-color: currentColor;
}

.guide-content :deep(strong) {
	color: var(--title-color);
	font-weight: 780;
}

.guide-content :deep(code) {
	border: 1px solid color-mix(in srgb, var(--text-main) 12%, transparent);
	background: color-mix(in srgb, var(--card-background) 82%, transparent);
	color: var(--title-color);
	font-family: var(--font-mono);
	font-size: 0.9em;
	padding: 0.08rem 0.32rem;
}

.guide-content :deep(pre) {
	margin: 0;
	max-width: 100%;
	overflow: auto;
	border: 1px solid color-mix(in srgb, var(--text-main) 12%, transparent);
	background: var(--code-bg);
	color: var(--code-text);
	padding: 1rem;
}

.guide-content :deep(pre code) {
	border: none;
	background: transparent;
	color: inherit;
	padding: 0;
}

.guide-content :deep(blockquote) {
	margin: 0;
	border-left: 3px solid var(--primary);
	background: var(--background);
	color: var(--text-secondary);
	padding: 0.85rem 1rem;
}

.guide-content :deep(blockquote p + p) {
	margin-top: 0.55rem;
}

.guide-content :deep(img) {
	width: min(100%, 840px);
	display: block;
	border: 1px solid color-mix(in srgb, var(--text-main) 12%, transparent);
	background: var(--background);
	object-fit: contain;
}

.guide-content :deep(.guide-table-wrap) {
	max-width: 100%;
	overflow: auto;
	border: 1px solid color-mix(in srgb, var(--text-main) 12%, transparent);
	background: var(--background);
}

.guide-content :deep(table) {
	width: 100%;
	border-collapse: collapse;
	min-width: 560px;
}

.guide-content :deep(th),
.guide-content :deep(td) {
	border-bottom: 1px solid var(--split);
	padding: 0.72rem 0.85rem;
	text-align: left;
	line-height: 1.5;
}

.guide-content :deep(th) {
	color: var(--title-color);
	background: var(--background-secondary);
	font-weight: 760;
}

.guide-skeleton {
	background: linear-gradient(
		90deg,
		color-mix(in srgb, var(--text-main) 7%, transparent),
		color-mix(in srgb, var(--text-main) 13%, transparent),
		color-mix(in srgb, var(--text-main) 7%, transparent)
	);
	background-size: 220% 100%;
	animation: guide-loading 1.2s ease-in-out infinite;
}

.guide-skeleton--kicker {
	width: 8rem;
	height: 0.9rem;
}

.guide-skeleton--title {
	width: min(36rem, 90%);
	height: 4rem;
}

.guide-skeleton--text {
	width: min(48rem, 100%);
	height: 1rem;
}

.guide-skeleton--short {
	width: min(28rem, 70%);
	height: 1rem;
}

.guide-footer {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.85rem;
	margin-top: clamp(2rem, 5vw, 3rem);
	padding-top: 1.25rem;
	border-top: 1px solid var(--split);
}

.guide-pager {
	min-width: 0;
	border: 1px solid var(--split);
	background: var(--background);
	color: var(--text-main);
	display: grid;
	gap: 0.35rem;
	text-align: left;
	padding: 0.95rem 1rem;
	cursor: pointer;
}

.guide-pager--next {
	text-align: right;
}

.guide-pager strong {
	color: var(--title-color);
	font-size: 0.98rem;
	line-height: 1.35;
	overflow-wrap: anywhere;
}

.guide-pager:hover,
.guide-pager:focus-visible {
	border-color: var(--primary);
	background: var(--background-secondary);
	outline: none;
}

.guide-pager:disabled {
	cursor: not-allowed;
	opacity: 0.46;
}

@keyframes guide-loading {
	to {
		background-position: -220% 0;
	}
}

@media (max-width: 900px) {
	.guides-page {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.guides-sidebar {
		width: 100%;
		position: static;
		max-height: none;
		overflow: visible;
		border-right: none;
		border-bottom: 1px solid var(--split);
		padding-right: 0;
		padding-bottom: 1rem;
	}

	.guides-sidebar-heading {
		margin-bottom: 0;
	}

	.guide-menu-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.guide-toolbar {
		display: flex;
	}

	.guide-nav {
		display: none;
		margin-top: 1rem;
	}

	.guide-nav.is-open {
		display: grid;
	}

	.guide-section {
		min-width: 0;
	}

	.guide-nav-item:hover,
	.guide-nav-item:focus-visible,
	.guide-nav-item.is-active {
		transform: none;
	}
}

@media (max-width: 640px) {
	.guide-toolbar {
		align-items: stretch;
		flex-direction: column;
	}

	.guide-toolbar select {
		max-width: none;
		width: 100%;
	}

	.guide-footer {
		grid-template-columns: 1fr;
	}

	.guide-pager--next {
		text-align: left;
	}
}
</style>
