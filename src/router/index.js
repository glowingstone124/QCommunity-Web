import { createRouter, createWebHistory } from 'vue-router'

const AccountCenterView = () => import('@/views/AccountCenterView.vue')
const AdvancementView = () => import('@/views/AdvancementView.vue')
const CardSingletonView = () => import('@/views/CardSingletonView.vue')
const DashboardView = () => import('@/views/DashBoardView.vue')
const GuidesView = () => import('@/views/GuidesView.vue')
const FallenTeamView = () => import('@/views/FallenTeamView.vue')
const HomeView = () => import('@/views/HomeView.vue')
const LoginView = () => import('@/views/LoginView.vue')
const MessageView = () => import('@/views/MessageView.vue')
const MiscView = () => import('@/views/MiscView.vue')
const NewsView = () => import('@/views/NewsView.vue')
const NotFoundView = () => import('@/views/NotFoundView.vue')
const QueryView = () => import('@/views/QueryView.vue')
const RankingsView = () => import('@/views/RankingsView.vue')
const RegisterView = () => import('@/views/RegisterView.vue')
const SponsorsView = () => import('@/views/SponsorsView.vue')
const TransportView = () => import('@/views/TransportView.vue')

const routes = [
	{
		path: '/',
		name: 'home',
		component: HomeView,
		meta: { pageTitleKey: '', showNavBar: true },
	},
	{
		path: '/collapse',
		name: 'collapse',
		component: FallenTeamView,
		meta: { pageTitleKey: 'collapsePage.title', showNavBar: true },
	},
	{
		path: '/login',
		name: 'login',
		component: LoginView,
		meta: { pageTitleKey: 'auth.loginTitle', showNavBar: true },
	},
	{
		path: '/query',
		name: 'query',
		component: QueryView,
		meta: { pageTitleKey: 'queryPage.title', showNavBar: true },
	},
	{
		path: '/messages',
		name: 'messages',
		component: MessageView,
		meta: { pageTitleKey: 'messagesPage.title', showNavBar: true, containedScroll: true },
	},
	{
		path: '/dashboard',
		name: 'dashboard',
		component: DashboardView,
		meta: { pageTitleKey: 'dashboardPage.title', showNavBar: true },
	},
	{
		path: '/rankings',
		name: 'rankings',
		component: RankingsView,
		meta: { pageTitleKey: 'rankingsPage.title', showNavBar: true },
	},
	{
		path: '/news/:id?',
		name: 'news',
		component: NewsView,
		meta: { pageTitleKey: 'newsPage.title', showNavBar: true },
	},
	{
		path: '/guides/:id?',
		name: 'guides',
		component: GuidesView,
		meta: { pageTitleKey: 'guidesPage.title', showNavBar: true },
	},
	{
		path: '/register',
		name: 'register',
		component: RegisterView,
		meta: { pageTitleKey: 'register.title', showNavBar: true },
	},
	{
		path: '/account',
		name: 'account',
		component: AccountCenterView,
		meta: { pageTitleKey: 'accountPage.title', showNavBar: true, containedScroll: true },
	},
	{
		path: '/sponsors',
		name: 'sponsors',
		component: SponsorsView,
		meta: { pageTitleKey: 'sponsorsPage.title', showNavBar: true },
	},
	{
		path: '/miscs',
		name: 'miscs',
		component: MiscView,
		meta: { pageTitleKey: 'miscPage.title', showNavBar: true },
	},
	{
		path: '/advancements',
		name: 'advancements',
		component: AdvancementView,
		meta: { pageTitleKey: 'advancementPage.title', showNavBar: true },
	},
	{
		path: '/transport',
		name: 'transport',
		component: TransportView,
		meta: { pageTitleKey: 'transportPage.title', showNavBar: true },
	},
	{
		path: '/card/:username',
		name: 'card',
		component: CardSingletonView,
		meta: { pageTitleKey: 'avatarPage.cardPageTitle', showNavBar: false },
		props: true,
	},
	{
		path: '/:catchAll(.*)',
		name: 'not-found',
		component: NotFoundView,
		meta: { pageTitleKey: 'notFoundPage.title', showNavBar: true },
	},
]

export default createRouter({
	history: createWebHistory(),
	routes,
})
