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
				<span class="logo-copy">
					<span class="logo-kicker">Quantum Original</span>
				</span>
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
									<span class="mega-kicker">{{ activeNavCategory.kicker }}</span>
									<strong>{{ activeNavCategory.title }}</strong>
								</div>

								<AppNavigation
									class="mega-links"
									:items="activeMegaItems"
									aria-label="主导航链接"
									density="compact"
									orientation="vertical"
									@select="goTo($event.path)"
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
						:title="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'"
						@click="toggleTheme"
					>
						{{ theme === 'dark' ? '🌙' : '☀️' }}
					</button>
					<button type="button" class="lang-btn" @click="toggleLang">
						{{ locale === 'zh' ? 'EN' : '中文' }}
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
const megaPanelHeight = ref('auto')
let resizeObserver = null
let clearNavTimer = 0

const navCategories = computed(() => [
	{
		key: 'community',
		label: locale.value === 'zh' ? '社区' : 'Community',
		kicker: loggedIn.value
			? (locale.value === 'zh' ? '进入社区' : 'Community')
			: (locale.value === 'zh' ? '需要账户' : 'Account Required'),
		title: loggedIn.value
			? (locale.value === 'zh' ? '账户、查询与消息' : 'Accounts, Query and Messages')
			: (locale.value === 'zh' ? '登录或注册后访问社区功能' : 'Sign in or register to access community features'),
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
				label: locale.value === 'zh' ? '登录账户' : 'Sign In',
				description: locale.value === 'zh' ? '使用已有 Quantum Original 账户继续访问社区。' : 'Continue with an existing Quantum Original account.',
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
		label: locale.value === 'zh' ? '服务器' : 'Server',
		kicker: locale.value === 'zh' ? '实时工具' : 'Live Tools',
		title: locale.value === 'zh' ? '状态、连接与交通' : 'Status, Connections and Transport',
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
		key: 'explore',
		label: locale.value === 'zh' ? '探索' : 'Explore',
		kicker: loggedIn.value
			? (locale.value === 'zh' ? '更多内容' : 'More')
			: (locale.value === 'zh' ? '需要账户' : 'Account Required'),
		title: loggedIn.value
			? (locale.value === 'zh' ? '成就、致谢与小功能' : 'Advancements, Sponsors and Tools')
			: (locale.value === 'zh' ? '登录或注册后访问探索内容' : 'Sign in or register to access explore content'),
		items: loggedIn.value ? [
			{
				path: '/advancements',
				label: t('mainPage.advancements'),
				description: locale.value === 'zh' ? t('mainPage_description.advancements') : 'Track QuantumOriginal advancement progress',
			},
			{
				path: '/miscs',
				label: t('mainPage.miscs'),
				description: t('mainPage_description.miscs'),
			},
		] : [
			{
				path: '/login',
				label: locale.value === 'zh' ? '登录账户' : 'Sign In',
				description: locale.value === 'zh' ? '登录后查看成就、小功能和更多内容。' : 'Sign in to view advancements, tools and more.',
			},
			{
				path: '/register',
				label: t('mainPage.register'),
				description: t('mainPage_description.register'),
			},
		],
	},
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
		label: item.label,
		description: item.description,
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

const goTo = (path) => {
	cancelClearActiveNav()
	activeNavKey.value = null
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
	box-shadow: none;
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
	background: #0B122050;
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

.logo-copy {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	line-height: 1;
	letter-spacing: 0;
}

.logo-kicker {
	font-size: 0.88rem;
	text-transform: uppercase;
	color: currentColor;
	opacity: 0.84;
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
}

.primary-nav {
	min-height: var(--app-header-height);
}

.mega-panel {
	position: absolute;
	top: 100%;
	left: 50%;
	width: 100vw;
	margin-left: -50vw;
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

.mega-kicker {
	font-size: 0.76rem;
	color: var(--text-secondary);
	text-transform: uppercase;
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
	.header-content {
		padding: 0.75rem 1rem;
		align-items: flex-start;
		flex-wrap: wrap;
	}

	.primary-nav {
		order: 3;
		width: 100%;
		min-height: 44px;
		overflow-x: auto;
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
	.header-content {
		flex-direction: row;
	}

	.logo-section,
	.user-section {
		width: 100%;
	}

	.user-section {
		justify-content: space-between;
	}

	.logo-section {
		width: auto;
	}

	.primary-nav {
		order: 2;
	}

	.user-section {
		order: 3;
	}

	.mega-panel-inner {
		grid-template-columns: 1fr;
		padding: 1rem;
	}

	.mega-links {
		grid-column: auto;
	}

	.login-alert {
		flex: 1;
		justify-content: center;
	}
}
</style>
