<template>
	<div class="background-blur" :class="{ active: isNavHovered }">
	</div>
	<header class="app-header">
		<div class="header-content">
			<button type="button" class="logo-section" @click="goHome">
				<img
					class="logo-mark"
					src="/images/qhub_icon_square_4096.png"
					alt=""
					aria-hidden="true"
				/>
				<span class="logo-text">QHub</span>
			</button>

			<div
				class="navigation-zone"
				data-guide-target="navigation"
				@mouseleave="clearActiveNav"
				@focusout="clearActiveNav"
			>
				<AppNavigation
					:active-key="activeNavKey"
					:aria-label="t('common.mainNavigation')"
					class="primary-nav"
					density="header"
					:items="primaryNavItems"
					orientation="horizontal"
					@activate="setActiveNav($event.key)"
					@select="setActiveNav($event.key)"
				/>
				<Transition name="mega-shell">
					<div
						v-if="activeNavCategory"
						class="mega-panel"
						:style="{ height: megaPanelHeight }"
						@mouseenter="cancelClearActiveNav"
					>
						<Transition
							name="mega-content"
							mode="out-in"
							@enter="measureMegaPanel"
							@after-enter="measureMegaPanel"
						>
							<div
								:key="activeNavCategory.key"
								ref="megaPanelContent"
								class="mega-panel-inner"
							>
								<div class="mega-panel-heading">
									<strong>{{ activeNavCategory.title }}</strong>
								</div>

								<AppNavigation
									class="mega-links"
									:items="activeMegaItems"
									:aria-label="t('common.mainNavigationLink')"
									density="compact"
									orientation="vertical"
									@select="goTo($event.path, $event)"
								/>
							</div>
						</Transition>
					</div>
				</Transition>
			</div>

			<div class="user-section" data-guide-target="account">
				<button v-if="!loggedIn" type="button" class="login-alert" @click="goToLogin">
					<span class="alert-text">{{ t('common.loginAlert') }}</span>
				</button>

				<div v-if="loggedIn" class="user-info">
					<span class="user-name">{{ username }}</span>
					<span class="user-role">{{ $t('mainPage.greeting_text', { played: playtime }) }}</span>
				</div>

				<button v-if="loggedIn" type="button" class="avatar-container" @click="toggleUserMenu">
					<img :src="avatarUrl" alt="User Avatar" class="user-avatar" />
					<span class="avatar-label">{{ $t('mainPage.account_center') }}</span>
				</button>

				<div class="header-actions">
					<button
						v-if="isGuideButtonVisible"
						type="button"
						class="guide-btn"
						:title="t('onboardingPage.start')"
						:aria-label="t('onboardingPage.start')"
						@click="openGuide"
					>
						?
					</button>
					<button type="button" class="lang-btn" @click="toggleLang">
						{{ nextLocaleLabel }}
					</button>
				</div>
			</div>
		</div>
	</header>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHeaderProfile } from '@/composables/useHeaderProfile.js'
import { useOnboardingGuide } from '@/composables/useOnboardingGuide.js'
import AppNavigation from '@/components/ui/AppNavigation.vue'

const router = useRouter()
const { locale, t } = useI18n()
const { avatarUrl, loggedIn, playtime, username } = useHeaderProfile()
const { isGuideButtonVisible, openGuide } = useOnboardingGuide()
const activeNavKey = ref(null)
const megaPanelContent = ref(null)
const isNavHovered = computed(() => activeNavKey.value !== null)
const nextLocaleLabel = computed(() => t(locale.value === 'zh' ? 'nav.language_english' : 'nav.language_chinese'))
const megaPanelHeight = ref('auto')
let resizeObserver = null
let clearNavTimer = 0

const navCategories = computed(() => [
	{
		key: 'community',
		label: t('nav.community'),
		title: loggedIn.value
			? t('nav.community_title_logged_in')
			: t('nav.community_title_guest'),
		items: loggedIn.value ? [
			{
				path: '/query',
				label: t('mainPage.query'),
				description: t('mainPage_description.query'),
			},
			{
				path: '/messages',
				label: t('mainPage.message_list'),
				description: t('mainPage_description.message_list'),
			},
		] : [
			{
				path: '/login',
				label: t('nav.sign_in'),
				description: t('nav.sign_in_description'),
			},
			{
				path: '/register',
				label: t('mainPage.register'),
				description: t('mainPage_description.register'),
			},
		],
	},
	{
		key: 'server',
		label: t('nav.server'),
		title: t('nav.server_title'),
		items: [
			{
				path: '/dashboard',
				label: t('mainPage.dashboard'),
				description: t('mainPage_description.dashboard'),
			},
			{
				path: '/rankings',
				label: t('mainPage.rankings'),
				description: t('mainPage_description.rankings'),
			},
			{
				path: '/transport',
				label: t('mainPage.transport'),
				description: t('mainPage_description.transport'),
			},
			{
				path: '/sponsors',
				label: t('mainPage.greetings'),
				description: t('mainPage_description.greetings'),
			},
		],
	},
	{
		key: 'guides',
		label: t('nav.content'),
		title: t('nav.content_title'),
		items: [
			{
				path: '/collapse',
				label: t('collapsePage.chooseFaction'),
				description: t('collapsePage.registerPreference'),
			},
			{
				path: '/news',
				label: t('nav.news'),
				description: t('nav.news_description'),
			},
			{
				path: '/guides',
				label: t('nav.wiki_guides'),
				description: t('nav.wiki_guides_description'),
			},
		],
	},
	{
		key: 'explore',
		label: t('nav.explore'),
		title: loggedIn.value
			? t('nav.explore_title_logged_in')
			: t('nav.explore_title_guest'),
		items: loggedIn.value ? [
			{
				path: 'https://ai.qoriginal.vip',
				external: true,
				target: '_blank',
				label: t('nav.ai_service'),
				description: t('nav.ai_service_description'),
			},
			{
				path: '/advancements',
				label: t('mainPage.advancements'),
				description: t('mainPage_description.advancements'),
			},
			{
				path: '/miscs',
				label: t('mainPage.miscs'),
				description: t('mainPage_description.miscs'),
			},
		] : [
			{
				path: 'https://ai.qoriginal.vip',
				external: true,
				target: '_blank',
				label: t('nav.ai_service'),
				description: t('nav.ai_service_description'),
			},
			{
				path: '/login',
				label: t('nav.sign_in'),
				description: t('nav.explore_sign_in_description'),
			},
			{
				path: '/register',
				label: t('mainPage.register'),
				description: t('mainPage_description.register'),
			},
		],
	},
	{
		key: 'join',
		label: t('nav.join_us'),
		title: t('nav.join_us_title'),
		items: [
			{
				path: 'https://qm.qq.com/q/ca25kxwf0k',
				external: true,
				label: t('nav.join_us_qq'),
				description: t('nav.join_us_qq_description'),
			}
		]
	}
])

const activeNavCategory = computed(() => {
	return navCategories.value.find((category) => category.key === activeNavKey.value) || null
})

const primaryNavItems = computed(() =>
	navCategories.value.map((category) => ({
		key: category.key,
		label: category.label,
	}))
)

const activeMegaItems = computed(() =>
	(activeNavCategory.value?.items || []).map((item) => ({
		key: item.path,
		path: item.path,
		external: item.external,
		target: item.target,
		label: item.label,
	}))
)

const measureMegaPanel = (element) => {
	const target = element || megaPanelContent.value

	if (!target) {
		return
	}

	megaPanelHeight.value = `${target.offsetHeight}px`
}

const scheduleMegaPanelMeasure = async () => {
	await nextTick()
	requestAnimationFrame(() => {
		measureMegaPanel()
	})
}

const setActiveNav = (key) => {
	cancelClearActiveNav()
	activeNavKey.value = key
}

const clearActiveNav = (event) => {
	if (event?.currentTarget?.contains(event.relatedTarget)) {
		return
	}

	clearNavTimer = window.setTimeout(() => {
		activeNavKey.value = null
	}, 120)
}

const cancelClearActiveNav = () => {
	if (clearNavTimer) {
		window.clearTimeout(clearNavTimer)
		clearNavTimer = 0
	}
}

const goHome = () => {
	router.push('/')
}

const isExternalUrl = (path) => /^[a-z][a-z0-9+.-]*:\/\//i.test(path) || path.startsWith('mailto:') || path.startsWith('tel:')

const goTo = (path, options = {}) => {
	cancelClearActiveNav()
	activeNavKey.value = null

	if (options.external || isExternalUrl(path)) {
		window.open(path, options.target || '_blank', 'noopener,noreferrer')
		return
	}

	router.push(path)
}

const toggleUserMenu = () => {
	router.push('/account')
}

const goToLogin = () => {
	router.push('/login')
}

const toggleLang = () => {
	locale.value = locale.value === 'zh' ? 'en' : 'zh'
	localStorage.setItem('locale', locale.value)
}

watch([activeNavCategory, locale, loggedIn, playtime], () => {
	if (activeNavCategory.value) {
		scheduleMegaPanelMeasure()
	}
})

onMounted(() => {
	resizeObserver = new ResizeObserver(() => {
		if (activeNavCategory.value) {
			measureMegaPanel()
		}
	})

	watch(megaPanelContent, (element) => {
		resizeObserver.disconnect()

		if (element) {
			resizeObserver.observe(element)
			measureMegaPanel(element)
		}
	})
})

onBeforeUnmount(() => {
	cancelClearActiveNav()
	resizeObserver?.disconnect()
})
</script>

<style scoped src="./NavBar.css"></style>
<style scoped src="./NavBarResponsive.css"></style>
