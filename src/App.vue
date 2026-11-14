<template>
	<div v-if="showNavBar" class="app-shell">
		<a class="skip-link" href="#main-content" @click.prevent="focusMainContent">
			{{ t('common.skipToContent') }}
		</a>
		<NavBar />
		<main
			id="main-content"
			ref="mainContentRef"
			class="app-main"
			:class="{ 'app-main--contained': route.meta.containedScroll }"
			tabindex="-1"
		>
			<router-view v-slot="{ Component, route: viewRoute }">
				<transition name="route-fade" mode="out-in">
					<component
						:is="Component"
						:key="['guides', 'news'].includes(viewRoute.name) ? viewRoute.name : viewRoute.fullPath"
					/>
				</transition>
			</router-view>
		</main>
	</div>
	<main v-else id="main-content" ref="mainContentRef" class="app-main-standalone" tabindex="-1">
		<router-view v-slot="{ Component, route: viewRoute }">
			<transition name="route-fade" mode="out-in">
				<component
					:is="Component"
					:key="['guides', 'news'].includes(viewRoute.name) ? viewRoute.name : viewRoute.fullPath"
				/>
			</transition>
		</router-view>
	</main>
	<OnboardingGuide v-if="!route.meta.authPage" />
	<TermsReviewGate v-if="!route.meta.authPage" />
</template>


<script setup>
import NavBar from './components/NavBar.vue';
import OnboardingGuide from './components/OnboardingGuide.vue'
import TermsReviewGate from './components/TermsReviewGate.vue'
import {useI18n} from 'vue-i18n'
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {hasPendingOnboardingPrompt, hasSeenOnboarding, useOnboardingGuide} from '@/composables/useOnboardingGuide.js'
const route = useRoute();
const showNavBar = computed(() => route.meta.showNavBar !== false);
const {locale, t} = useI18n()
const {openPrompt} = useOnboardingGuide()
const mainContentRef = ref(null)
let onboardingPromptTimer = 0

function focusMainContent() {
	mainContentRef.value?.focus({ preventScroll: false })
}

function syncDocumentTitle() {
	const title = route.meta.pageTitleKey ? t(route.meta.pageTitleKey) : ''
	document.title = title ? `QHub | ${title}` : 'QHub'
}

// Keep <html lang> accurate: it drives CJK glyph selection, hyphenation and screen-reader voice.
watch(locale, value => {
	document.documentElement.lang = value === 'zh' ? 'zh-CN' : 'en'
}, {immediate: true})

function scheduleOnboardingPrompt() {
	if (onboardingPromptTimer) {
		window.clearTimeout(onboardingPromptTimer)
		onboardingPromptTimer = 0
	}

	if (route.path === '/' && hasPendingOnboardingPrompt() && !hasSeenOnboarding()) {
		onboardingPromptTimer = window.setTimeout(() => openPrompt(), 650)
	}
}

onMounted(() => {
	scheduleOnboardingPrompt()
});

watch(() => route.path, scheduleOnboardingPrompt)
watch([() => route.name, locale], syncDocumentTitle, {immediate: true})

onBeforeUnmount(() => {
	if (onboardingPromptTimer) {
		window.clearTimeout(onboardingPromptTimer)
	}
})
</script>

<style>
@import "/src/assets/main.css";
@import "/src/assets/modern-ui.css";
:where(button, [role="button"], .logo-section, .app-navigation-item) {
	user-select: none;
}

input, textarea, article, .article-content, .markdown-body, [data-selectable] {
	user-select: text;
}

::-webkit-scrollbar {
	width: 8px;
	height: 8px;
	background-color: transparent;
}

::-webkit-scrollbar-track {
	background-color: transparent;
}

::-webkit-scrollbar-thumb {
	background-color: color-mix(in srgb, var(--text-secondary) 42%, transparent);
	border-radius: 999px;
	border: 2px solid transparent;
	background-clip: content-box;
}

::-webkit-scrollbar-thumb:hover {
	background-color: color-mix(in srgb, var(--text-main) 58%, transparent);
}

:root[data-theme="dark"] ::-webkit-scrollbar-track {
	background-color: var(--background);
}

:root[data-theme="dark"] ::-webkit-scrollbar-thumb {
	background-color: var(--dark-border);
	border-color: var(--background);
}

* {
	scrollbar-width: thin;
	scrollbar-color: color-mix(in srgb, var(--text-secondary) 42%, transparent) transparent;
}

.app-shell {
	height: 100dvh;
	background-color: var(--page-background);
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.app-main {
	width: 100%;
	flex: 1;
	min-height: 0;
	background: var(--page-background);
	overflow: auto;
	overflow-x: hidden;
	-webkit-overflow-scrolling: touch;
	overscroll-behavior-y: contain;
	touch-action: pan-y;
}

.app-main--contained {
	overflow: hidden;
}

.app-main-standalone {
	width: 100%;
	min-height: 100dvh;
	background: var(--page-background);
}

.route-fade-enter-active,
.route-fade-leave-active {
	transition: opacity var(--motion-fast) var(--ease-out), transform var(--motion-fast) var(--ease-out);
}

.route-fade-enter-from {
	opacity: 0;
	transform: translateY(6px);
}

.route-fade-leave-to {
	opacity: 0;
	transform: translateY(-2px);
}

@media (prefers-reduced-motion: reduce) {
	.route-fade-enter-active,
	.route-fade-leave-active {
		transition: none;
	}
}

</style>
