import { createRouter, createWebHistory } from 'vue-router'

const AccountCenterView = () => import('@/views/AccountCenterView.vue')
const AdvancementView = () => import('@/views/AdvancementView.vue')
const CardSingletonView = () => import('@/views/CardSingletonView.vue')
const DashboardView = () => import('@/views/DashBoardView.vue')
const HomeView = () => import('@/views/HomeView.vue')
const LoginView = () => import('@/views/LoginView.vue')
const MessageView = () => import('@/views/MessageView.vue')
const MiscView = () => import('@/views/MiscView.vue')
const NewsView = () => import('@/views/NewsView.vue')
const NotFoundView = () => import('@/views/NotFoundView.vue')
const QueryView = () => import('@/views/QueryView.vue')
const RegisterView = () => import('@/views/RegisterView.vue')
const SponsorsView = () => import('@/views/SponsorsView.vue')
const TransportView = () => import('@/views/TransportView.vue')

const routes = [
	{
		path: '/',
		name: 'home',
		component: HomeView,
		meta: { pageTitle: '', showNavBar: true },
	},
	{
		path: '/login',
		name: 'login',
		component: LoginView,
		meta: { pageTitle: '登录', showNavBar: true },
	},
	{
		path: '/query',
		name: 'query',
		component: QueryView,
		meta: { pageTitle: '查询', showNavBar: true },
	},
	{
		path: '/messages',
		name: 'messages',
		component: MessageView,
		meta: { pageTitle: '聊天记录', showNavBar: true, containedScroll: true },
	},
	{
		path: '/dashboard',
		name: 'dashboard',
		component: DashboardView,
		meta: { pageTitle: '仪表板', showNavBar: true },
	},
	{
		path: '/news/:id?',
		name: 'news',
		component: NewsView,
		meta: { pageTitle: '', showNavBar: true },
	},
	{
		path: '/register',
		name: 'register',
		component: RegisterView,
		meta: { pageTitle: '注册', showNavBar: true },
	},
	{
		path: '/account',
		name: 'account',
		component: AccountCenterView,
		meta: { pageTitle: '账户中心', showNavBar: true, containedScroll: true },
	},
	{
		path: '/sponsors',
		name: 'sponsors',
		component: SponsorsView,
		meta: { pageTitle: '致谢', showNavBar: true },
	},
	{
		path: '/miscs',
		name: 'miscs',
		component: MiscView,
		meta: { pageTitle: '小功能', showNavBar: true },
	},
	{
		path: '/advancements',
		name: 'advancements',
		component: AdvancementView,
		meta: { pageTitle: '成就', showNavBar: true },
	},
	{
		path: '/transport',
		name: 'transport',
		component: TransportView,
		meta: { pageTitle: '交通', showNavBar: true },
	},
	{
		path: '/card/:username',
		name: 'card',
		component: CardSingletonView,
		meta: { pageTitle: '用户卡片', showNavBar: false },
		props: true,
	},
	{
		path: '/:catchAll(.*)',
		name: 'not-found',
		component: NotFoundView,
		meta: { pageTitle: '页面不存在', showNavBar: true },
	},
]

export default createRouter({
	history: createWebHistory(),
	routes,
})
