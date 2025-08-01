import { createApp } from 'vue';
import App from './App.vue';

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

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView,
    },
    {
        path: '/login',
        name: 'login',
        component: LoginView,
    },
    {
        path: '/query',
        name: 'query',
        component: QueryView,
    },
    {
        path: '/messages',
        name: 'messages',
        component: MessageView
    },
    {
        path: '/dashboard',
        name: 'dashboard',
        component: DashboardView,
    },
    {
        path: '/news',
        name: 'news',
        component: NewsView,
    },
    {
        path: '/register',
        name: 'register',
        component: RegisterView,
    },
    {
        path: '/account',
        name: 'account',
        component: AccountCenterView,
    },
    {
        path: '/sponsors',
        name: 'sponsors',
        component: SponsorsView,
    },
    {
      path: '/miscs',
      name: 'miscs',
      component: MiscView,
    },
    {
        path: '/:catchAll(.*)',
        name: 'not-found',
        component: NotFoundView
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

createApp(App)
    .use(router)
    .use(i18n)
    .mount('#app');
