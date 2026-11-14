<script setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {loadNewsFeed} from '@/utils/newsFeed'
import {initHomeShaderBackground} from '@/utils/homeShader'
import UiButton from '@/components/ui/UiButton.vue'
import {useUiPreferences} from '@/composables/useUiPreferences.js'
import {homeCampaign, regularHome} from '@/data/home'
import {collapseSchedule} from '@/data/collapse.js'
import XiaohongshuIcon from '@iconify-vue/simple-icons/xiaohongshu';
import BilibiliIcon from '@iconify-vue/simple-icons/bilibili';
const {locale, t} = useI18n()
const {isModernUi} = useUiPreferences()
const shaderCanvas = ref(null)
const homeRoot = ref(null)
const newsItems = ref([])
let cleanupShader = () => {}
let newsRefreshTimer = 0
let revealObserver = null
const activeHome = computed(() => (homeCampaign.enabled ? homeCampaign : regularHome))
const heroTitle = computed(() => t(activeHome.value.titleKey))

const localizedNews = computed(() =>
	newsItems.value.slice(0, 20).map((item, index) => ({
		...item,
		isFeatured: homeCampaign.enabled
			? item.id === homeCampaign.featuredNewsId || (!homeCampaign.featuredNewsId && index === 0)
			: index === 0,
		type: item.type[locale.value] || item.type.zh,
		title: item.title[locale.value] || item.title.zh,
		description: item.description[locale.value] || item.description.zh,
	}))
)
const featuredNews = computed(() => localizedNews.value.find((item) => item.isFeatured) || localizedNews.value[0] || null)
const regularNews = computed(() => localizedNews.value.filter((item) => item.id !== featuredNews.value?.id))
const currentYear = new Date().getFullYear()

async function syncNewsFeed() {
	newsItems.value = await loadNewsFeed()
}

async function observeRevealItems() {
	await nextTick()
	const elements = homeRoot.value?.querySelectorAll('.reveal-item:not(.is-observed)') || []
	elements.forEach((element) => {
		element.classList.add('is-observed')
		if (revealObserver) {
			revealObserver.observe(element)
		} else {
			element.classList.add('is-visible')
		}
	})
}


let scrollTicking = false
function handleScroll() {
	if (!scrollTicking) {
		window.requestAnimationFrame(() => {
			const scrollContainer = homeRoot.value?.closest('.app-main') || document.documentElement
			const scrollY = scrollContainer ? scrollContainer.scrollTop : (window.scrollY || 0)
			const threshold = Math.max(window.innerHeight * 0.55, 200)
			const progress = Math.min(Math.max(scrollY / threshold, 0), 1)
			if (homeRoot.value) {
				homeRoot.value.style.setProperty('--feed-scroll-progress', progress.toFixed(3))
			}
			scrollTicking = false
		})
		scrollTicking = true
	}
}

onMounted(async () => {
	cleanupShader = initHomeShaderBackground(shaderCanvas.value) || (() => {})
	const scrollContainer = homeRoot.value?.closest('.app-main') || window
	scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
	window.addEventListener('scroll', handleScroll, { passive: true })
	handleScroll()

	if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
		revealObserver = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return
				entry.target.classList.add('is-visible')
				revealObserver?.unobserve(entry.target)
			})
		}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
	}
	await syncNewsFeed()
	await observeRevealItems()
	newsRefreshTimer = window.setInterval(syncNewsFeed, 15000)
})

watch(newsItems, observeRevealItems)

onBeforeUnmount(() => {
	const scrollContainer = homeRoot.value?.closest('.app-main') || window
	scrollContainer.removeEventListener('scroll', handleScroll)
	window.removeEventListener('scroll', handleScroll)
	window.clearInterval(newsRefreshTimer)
	revealObserver?.disconnect()
	cleanupShader()
})
</script>

<template>
	<div ref="homeRoot" class="home page-shell" :class="{ 'home--campaign': homeCampaign.enabled }">
		<canvas ref="shaderCanvas" class="shader-background" aria-hidden="true"></canvas>
		<div class="shader-scroll-overlay" aria-hidden="true"></div>
		<div class="home-content">
			<section class="home-hero" aria-labelledby="home-title" data-guide-target="home-hero">
				<div class="hero-copy">
					<h1 id="home-title">{{ heroTitle }}</h1>
					<div v-if="homeCampaign.enabled" class="collapse-choice-prompt">
						<div class="choice-prompt-signal" aria-hidden="true">
							<span></span><span></span><span></span>
						</div>
						<div class="choice-prompt-copy">
							<strong>{{ t(locale === 'zh' ? 'homeCampaign.launches' : 'homeCampaign.launchesEn', { date: collapseSchedule.startDateShortText[locale] || collapseSchedule.startDateShortText.zh }) }}</strong>
							<p>{{ t(locale === 'zh' ? 'homeCampaign.description' : 'homeCampaign.descriptionEn') }}</p>
						</div>
						<UiButton
							class="choice-prompt-action"
							variant="filled"
							to="/collapse"
							trailing-icon="arrow_forward"
						>
							<span>{{ t(locale === 'zh' ? 'homeCampaign.explore' : 'homeCampaign.exploreEn') }}</span>
							<span v-if="!isModernUi" aria-hidden="true">→</span>
						</UiButton>
					</div>
				</div>
				<a class="scroll-cue" href="#home-news" :aria-label="t('homePage.scroll_to_feed')">
					<span>{{ t('homePage.scroll_to_feed') }}</span>
					<span class="scroll-cue-line" aria-hidden="true"></span>
				</a>
			</section>


			<section id="home-news" class="news-feed" aria-labelledby="news-title" data-guide-target="home-news">
				<header class="section-heading">
					<h2 id="news-title">{{ t('homePage.latest_news') }}</h2>
				</header>
				<article
					v-if="featuredNews"
					class="news-item news-item--featured reveal-item"
					:class="{
						'news-item--text-only': !featuredNews.image,
						'news-item--collapse': featuredNews.id === '2026collapse',
					}"
				>
					<div v-if="featuredNews.image" class="news-image">
						<img :src="featuredNews.image" :alt="featuredNews.title" loading="lazy">
					</div>
					<div class="news-body">
						<h3>{{ featuredNews.title }}</h3>
						<div class="news-meta">
							<span>{{ featuredNews.type }}</span>
							<time :datetime="featuredNews.date">{{ featuredNews.date }}</time>
						</div>
						<p v-if="featuredNews.id === '2026collapse'" class="news-deck">{{ featuredNews.description }}</p>
						<UiButton
							class="news-link"
							:variant="featuredNews.id === '2026collapse' ? 'danger' : 'tonal'"
							size="sm"
							:to="featuredNews.to"
							trailing-icon="arrow_forward"
						>
							<span>{{ t('homePage.read_more') }}</span>
							<span v-if="!isModernUi" class="news-link-arrow" aria-hidden="true"></span>
						</UiButton>
					</div>
				</article>

				<div class="news-list" v-if="regularNews.length">
					<article
						v-for="(item, index) in regularNews"
						:key="item.id"
						class="news-item reveal-item"
						:class="{
							'news-item--text-only': !item.image,
							'news-item--collapse': item.id === '2026collapse',
						}"
						:style="{ '--reveal-order': Math.min(index, 5) }"
					>
						<div v-if="item.image" class="news-image">
							<img :src="item.image" :alt="item.title" loading="lazy">
						</div>
						<div class="news-body">
							<h3>{{ item.title }}</h3>
							<div class="news-meta">
								<span>{{ item.type }}</span>
								<time :datetime="item.date">{{ item.date }}</time>
							</div>
							<UiButton
								class="news-link"
								variant="tonal"
								size="sm"
								:to="item.to"
								trailing-icon="arrow_forward"
							>
								<span>{{ t('homePage.read_more') }}</span>
								<span v-if="!isModernUi" class="news-link-arrow" aria-hidden="true"></span>
							</UiButton>
						</div>
					</article>
				</div>
			</section>

			<footer class="home-footer reveal-item">
				<div class="footer-brand">
					<strong>Quantum Original</strong>
					<div class="logos">
						<a
							class="logo"
							href="https://www.xiaohongshu.com/user/profile/68d2279d000000001a0061da"
							target="_blank"
							rel="noopener noreferrer"
							:aria-label="t('homePage.social_xiaohongshu')"
							:title="t('homePage.social_xiaohongshu')"
						>
							<XiaohongshuIcon height="1.5em" aria-hidden="true" />
						</a>
						<a
							class="logo"
							href="https://space.bilibili.com/1092677075"
							target="_blank"
							rel="noopener noreferrer"
							:aria-label="t('homePage.social_bilibili')"
							:title="t('homePage.social_bilibili')"
						>
							<BilibiliIcon height="1.5em" aria-hidden="true" />
						</a>
					</div>
					<p>Copyright {{ currentYear }} Quantum Original & Holographic Lab. All rights reserved.</p>
				</div>
			</footer>
		</div>
	</div>
</template>

<style scoped src="./styles/home/content.css"></style>
<style scoped src="./styles/home/news.css"></style>
<style scoped src="./styles/home/effects.css"></style>
