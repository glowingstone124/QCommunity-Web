import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia'

import i18n from './i18n.js';

import { createRouter, createWebHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import LoginView from './views/LoginView.vue';
import QueryView from "./views/QueryView.vue";
import MessageView from "./views/MessageView.vue";
import NotFoundView from './views/NotFoundView.vue';
import DashboardView from "./views/DashBoardView.vue";
import RegisterView from "./views/RegisterView.vue";
import NewsView from "@/views/NewsView.vue";
import AccountCenterView from "@/views/AccountCenterView.vue";
import SponsorsView from "@/views/SponsorsView.vue";
import MiscView from "@/views/MiscView.vue";

import "@/assets/colors.css"
import {usePageStore} from "@/utils/store.ts";

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView,
        meta: { pageTitle: '' }
    },
    {
        path: '/login',
        name: 'login',
        component: LoginView,
        meta: { pageTitle: '登录' }
    },
    {
        path: '/query',
        name: 'query',
        component: QueryView,
        meta: { pageTitle: '查询' }
    },
    {
        path: '/messages',
        name: 'messages',
        component: MessageView,
        meta: { pageTitle: '聊天记录' }
    },
    {
        path: '/dashboard',
        name: 'dashboard',
        component: DashboardView,
        meta: { pageTitle: '仪表板' }
    },
    {
        path: '/news',
        name: 'news',
        component: NewsView,
        meta: { pageTitle: '' }
    },
    {
        path: '/register',
        name: 'register',
        component: RegisterView,
        meta: { pageTitle: '注册' }
    },
    {
        path: '/account',
        name: 'account',
        component: AccountCenterView,
        meta: { pageTitle: '账户中心' }
    },
    {
        path: '/sponsors',
        name: 'sponsors',
        component: SponsorsView,
        meta: { pageTitle: '致谢' }
    },
    {
        path: '/miscs',
        name: 'miscs',
        component: MiscView,
        meta: { pageTitle: '小功能' }
    },
    {
        path: '/:catchAll(.*)',
        name: 'not-found',
        component: NotFoundView,
        meta: { pageTitle: '页面不存在' }
    }
]


const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const pageStore = usePageStore()
    pageStore.setPage(to.meta.pageTitle || '')
    next()
})
createApp(App)
    .use(router)
    .use(i18n)
    .use(createPinia())
    .mount('#app');
