import { createApp } from 'vue';
import App from './App.vue';

import { createRouter, createWebHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import LoginView from './views/LoginView.vue';
import QueryView from "@/views/QueryView.vue";
import MessageView from "./views/MessageView.vue";
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
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

createApp(App).use(router).mount('#app');
