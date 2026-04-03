import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia'

import i18n from './i18n.js';
import router from '@/router'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faClock } from '@fortawesome/free-regular-svg-icons'

library.add(faClock)
import "@/assets/colors.css"
import {usePageStore} from "@/utils/store.ts";

const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";

router.beforeEach((to, from, next) => {
    const pageStore = usePageStore()
    pageStore.setPage(to.meta.pageTitle || '')
    next()
})
const app = createApp(App)
    .use(router)
    .use(i18n)
    .use(createPinia())
    .component('font-awesome-icon', FontAwesomeIcon)
    .mount('#app');
