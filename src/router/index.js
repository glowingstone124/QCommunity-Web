import { createRouter, createWebHistory } from 'vue-router'
import AccountCenterView from '@/views/AccountCenterView.vue'
import AdvancementView from '@/views/AdvancementView.vue'
import CardSingletonView from '@/views/CardSingletonView.vue'
import DashboardView from '@/views/DashBoardView.vue'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import MessageView from '@/views/MessageView.vue'
import MiscView from '@/views/MiscView.vue'
import NewsView from '@/views/NewsView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import QueryView from '@/views/QueryView.vue'
import RegisterView from '@/views/RegisterView.vue'
import SponsorsView from '@/views/SponsorsView.vue'
import TransportView from '@/views/TransportView.vue'

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
		meta: { pageTitle: '聊天记录', showNavBar: true },
	},
	{
		path: '/dashboard',
		name: 'dashboard',
		component: DashboardView,
		meta: { pageTitle: '仪表板', showNavBar: true },
	},
	{
		path: '/news',
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
		meta: { pageTitle: '账户中心', showNavBar: true },
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
