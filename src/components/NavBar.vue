<template>
	<div class="background-blur" :class="{ active: isNavHovered }">
	</div>
	<header class="app-header">
		<div class="header-content">
			<button type="button" class="logo-section" @click="goHome">
				<span class="logo-mark" aria-hidden="true">
					<span class="logo-mark-main"></span>
					<span class="logo-mark-sub"></span>
				</span>
				<span class="logo-text">QHub</span>
			</button>

			<div
				class="navigation-zone"
				@mouseleave="clearActiveNav"
				@focusout="clearActiveNav"
			>
				<AppNavigation
					:active-key="activeNavKey"
					aria-label="主导航"
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
									aria-label="主导航链接"
									density="compact"
									orientation="vertical"
									@select="goTo($event.path, $event)"
								/>
							</div>
						</Transition>
					</div>
				</Transition>
			</div>

			<div class="user-section">
				<button v-if="!loggedIn" type="button" class="login-alert" @click="goToLogin">
					<span class="alert-text">点击此处登录</span>
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
						type="button"
						class="theme-btn"
						:title="themeToggleTitle"
						@click="toggleTheme"
					>
						{{ theme === 'dark' ? '🌙' : '☀️' }}
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
import AppNavigation from '@/components/ui/AppNavigation.vue'

const router = useRouter()
const { locale, t } = useI18n()
const { avatarUrl, loggedIn, playtime, theme, username } = useHeaderProfile()
const activeNavKey = ref(null)
const megaPanelContent = ref(null)
const isNavHovered = computed(() => activeNavKey.value !== null)
const nextLocaleLabel = computed(() => t(locale.value === 'zh' ? 'nav.language_english' : 'nav.language_chinese'))
const themeToggleTitle = computed(() => t(theme.value === 'dark' ? 'nav.theme_light' : 'nav.theme_dark'))
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

const toggleTheme = () => {
	theme.value = theme.value === 'dark' ? 'light' : 'dark'
	document.documentElement.dataset.theme = theme.value
	localStorage.setItem('theme', theme.value)
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

<style scoped>
.app-header {
	width: 100%;
	min-height: var(--app-header-height);
	position: relative;
	z-index: 40;
	background: color-mix(in srgb, var(--background) 92%, transparent);
	border-bottom: 1px solid var(--split);
}

.header-content {
	width: min(1280px, 100%);
	min-height: var(--app-header-height);
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin: 0 auto;
	padding: 0 1rem;
	gap: 1rem;
	position: relative;
	box-sizing: border-box;
}

.logo-section {
	cursor: pointer;
	border: 1px none var(--text-main);
	background: transparent;
	padding: 0.35rem 0.7rem 0.35rem 0.42rem;
	display: inline-flex;
	align-items: center;
	gap: 0.88rem;
	color: var(--text-main);
	min-height: 50px;
	transition:
		background-color 160ms ease,
		color 160ms ease,
		transform 160ms ease;
}

.logo-section:hover {
	background: var(--text-main);
	color: var(--background);
}

.logo-mark {
	width: 30px;
	height: 36px;
	position: relative;
	flex: 0 0 auto;
}

.logo-mark-main,
.logo-mark-sub {
	position: absolute;
	border: 2px solid currentColor;
	transform: skewY(10deg);
	background: transparent;
}
.background-blur {
	z-index: 39;
	position: fixed;
	inset: 0;
	backdrop-filter: blur(0px);
	background: transparent;
	opacity: 0;
	pointer-events: none;
	transition:
		opacity 180ms ease,
		backdrop-filter 180ms ease,
		background-color 180ms ease;
}

.background-blur.active {
	backdrop-filter: blur(10px);
	background: #03050A66;
	opacity: 1;
}
.logo-mark-main {
	inset: 1px 8px 8px 2px;
}

.logo-mark-sub {
	width: 12px;
	height: 14px;
	right: 1px;
	bottom: 1px;
}

.logo-text {
	font-size: 1.08rem;
	font-weight: 800;
	color: currentColor;
	margin: 0;
	text-align: left;
}

.navigation-zone {
	display: flex;
	align-self: stretch;
	min-width: 0;
}

.primary-nav {
	min-height: var(--app-header-height);
}

.mega-panel {
	position: absolute;
	top: 100%;
	left: calc(50% - 50vw);
	width: 100vw;
	border-bottom: 1px solid var(--split);
	background: var(--background);
	pointer-events: auto;
	overflow: hidden;
	transform-origin: top center;
	will-change: opacity, transform;
	transition: height 180ms ease;
}

.mega-shell-enter-active,
.mega-shell-leave-active {
	transition:
		opacity 180ms ease,
		transform 180ms ease;
}

.mega-shell-enter-from,
.mega-shell-leave-to {
	opacity: 0;
	transform: translateY(-8px) scaleY(0.98);
}

.mega-shell-enter-to,
.mega-shell-leave-from {
	opacity: 1;
	transform: translateY(0) scaleY(1);
}

.mega-content-enter-active,
.mega-content-leave-active {
	transition:
		opacity 120ms ease,
		transform 120ms ease;
}

.mega-content-enter-from {
	opacity: 0;
	transform: translateY(6px);
}

.mega-content-leave-to {
	opacity: 0;
	transform: translateY(-4px);
}

.mega-content-enter-to,
.mega-content-leave-from {
	opacity: 1;
	transform: translateY(0);
}

.mega-panel-inner {
	width: min(1120px, 100%);
	margin: 0 auto;
	padding: 1.4rem 1.5rem 1.55rem;
	display: grid;
	grid-template-columns: minmax(180px, 0.62fr) minmax(260px, 0.82fr) 1fr;
	gap: 1.3rem;
}

.mega-panel-heading {
	display: flex;
	flex-direction: column;
	gap: 0.55rem;
	color: var(--text-main);
}

.mega-panel-heading strong {
	font-size: 1.4rem;
	line-height: 1.15;
}

.mega-links {
	grid-column: 2;
}

.user-section {
	--header-control-height: 46px;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-left: auto;
}

.user-info {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: flex-start;
	min-height: var(--header-control-height);
	border: 1px solid var(--split);
	padding: 0 0.85rem;
	box-sizing: border-box;
}

.user-name {
	font-weight: 600;
	color: var(--text-main);
}

.user-role {
	font-size: 0.8em;
	color: var(--text-secondary);
}

.avatar-container {
	display: flex;
	align-items: center;
	gap: 0.55rem;
	border: 1px solid var(--split);
	background: transparent;
	padding: 0 0.85rem 0 0.25rem;
	height: var(--header-control-height);
	box-sizing: border-box;
	cursor: pointer;
	color: var(--text-main);
	transition:
		border-color 160ms ease,
		background-color 160ms ease;
}

.avatar-container:hover {
	border-color: var(--text-main);
	background: var(--background-secondary);
}

.avatar-label {
	color: currentColor;
	font-size: 0.9em;
	white-space: nowrap;
}

.user-avatar {
	width: calc(var(--header-control-height) - 10px);
	height: calc(var(--header-control-height) - 10px);
	border-radius: 0;
	flex-shrink: 0;
	object-fit: cover;
	border: 1px solid var(--split);
}

.login-alert {
	background: transparent;
	color: var(--text-main);
	padding: 0 0.95rem;
	height: var(--header-control-height);
	box-sizing: border-box;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	border: 1px solid var(--text-main);
	transition:
		background-color 160ms ease,
		color 160ms ease;
}

.login-alert:hover {
	background: var(--text-main);
	color: var(--background);
}

.alert-text {
	font-weight: 500;
	font-size: 0.95rem;
}

.header-actions {
	display: flex;
	align-items: center;
	gap: 0.55rem;
	height: var(--header-control-height);
}

.lang-btn,
.theme-btn {
	padding: 0 0.8rem;
	height: var(--header-control-height);
	min-width: var(--header-control-height);
	box-sizing: border-box;
	font-size: 0.9rem;
	cursor: pointer;
	border-radius: 0;
}

.lang-btn {
	background: transparent;
	color: var(--text-main);
	border: 1px solid var(--split);
}

.lang-btn:hover {
	border-color: var(--text-main);
	background: var(--background-secondary);
}

.theme-btn {
	background: transparent;
	color: var(--text-main);
	border: 1px solid var(--split);
}

.theme-btn:hover {
	border-color: var(--text-main);
	background: var(--background-secondary);
}

@media (max-width: 980px) {
	:global(:root) {
		--app-header-height: 128px;
	}

	.header-content {
		padding: 0.75rem 1rem;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 0.65rem;
		overflow: visible;
	}

	.navigation-zone {
		order: 3;
		width: 100%;
		max-width: 100%;
		min-width: 0;
		overflow: visible;
	}

	.primary-nav {
		width: 100%;
		max-width: 100%;
		min-width: 0;
		min-height: 44px;
		overflow-x: auto;
		overflow-y: hidden;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}

	.primary-nav::-webkit-scrollbar {
		display: none;
	}

	.mega-panel {
		top: 100%;
	}

	.user-section {
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.user-info {
		display: none;
	}

	.avatar-label {
		display: none;
	}
}

@media (max-width: 640px) {
	:global(:root) {
		--app-header-height: 108px;
	}

	.header-content {
		flex-direction: row;
		align-items: center;
		padding: 0.55rem 0.75rem;
		gap: 0.45rem;
	}

	.user-section {
		--header-control-height: 40px;
		order: 1;
		width: auto;
		margin-left: auto;
		justify-content: flex-end;
		flex-wrap: nowrap;
		gap: 0.4rem;
	}

	.logo-section {
		order: 1;
		width: auto;
		max-width: none;
		min-height: 40px;
		padding: 0.2rem 0.45rem 0.2rem 0.3rem;
		gap: 0.5rem;
	}

	.logo-mark {
		width: 26px;
		height: 31px;
	}

	.logo-text {
		display: none;
	}

	.navigation-zone {
		order: 2;
		flex-basis: 100%;
	}

	.header-actions {
		gap: 0.35rem;
	}

	.lang-btn,
	.theme-btn {
		padding: 0 0.55rem;
		min-width: var(--header-control-height);
	}

	.mega-panel-inner {
		grid-template-columns: 1fr;
		padding: 1rem;
	}

	.mega-links {
		grid-column: auto;
	}

	.login-alert {
		flex: 0 1 auto;
		justify-content: center;
		padding: 0 0.7rem;
	}

	.alert-text {
		font-size: 0.86rem;
	}
}

@media (max-width: 360px) {
	.header-content {
		padding: 0.45rem;
		gap: 0.3rem;
	}

	.logo-section {
		min-width: 0;
		padding-inline: 0.2rem;
	}

	.logo-mark {
		width: 23px;
		height: 28px;
	}

	.user-section {
		--header-control-height: 36px;
		min-width: 0;
		gap: 0.25rem;
	}

	.header-actions {
		gap: 0.25rem;
	}

	.lang-btn,
	.theme-btn {
		min-width: 36px;
		padding-inline: 0.4rem;
		font-size: 0.8rem;
	}

	.login-alert {
		min-width: 0;
		padding-inline: 0.5rem;
	}

	.alert-text {
		font-size: 0.74rem;
		white-space: nowrap;
	}

	.mega-panel-inner {
		padding: 0.75rem;
	}
}
</style>
