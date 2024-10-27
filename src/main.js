import { createApp } from 'vue';
import App from './App.vue';

import { createRouter, createWebHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import LoginView from './views/LoginView.vue';
import QueryView from "@/views/QueryView.vue";
import MessageView from "./views/MessageView.vue";
import NotFoundView from './views/NotFoundView.vue'; // 导入404组件

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
        path: '/:catchAll(.*)', // 捕获所有未匹配的路由
        name: 'not-found',
        component: NotFoundView // 指定404组件
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

createApp(App).use(router).mount('#app');
