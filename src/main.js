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
import { loadCoreAssets } from "@/utils/assetLoader.js";

const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";

function updateAssetLoader(percent) {
    const normalizedPercent = Math.min(Math.max(percent, 0), 100);
    const percentText = document.getElementById('asset-loader-percent');
    const progressBar = document.getElementById('asset-loader-bar');

    if (percentText) {
        percentText.textContent = `${normalizedPercent}%`;
    }

    if (progressBar) {
        progressBar.style.width = `${normalizedPercent}%`;
    }
}

function hideAssetLoader() {
    const loader = document.getElementById('asset-loader');

    if (!loader) {
        return;
    }

    loader.classList.add('is-hidden');
    window.setTimeout(() => loader.remove(), 220);
}

router.beforeEach((to, from, next) => {
    const pageStore = usePageStore()
    pageStore.setPage(to.meta.pageTitle || '')
    next()
})

const pinia = createPinia()

async function bootstrap() {
    await loadCoreAssets(updateAssetLoader);

    const app = createApp(App)

    app
    .use(pinia)
    .use(router)
    .use(i18n)
    .component('font-awesome-icon', FontAwesomeIcon)

    await router.isReady();
    app.mount('#app');
    hideAssetLoader();
}

bootstrap().catch(error => {
    console.error(error);
    hideAssetLoader();
});
