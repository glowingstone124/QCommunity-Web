<template>
	<div v-if="showNavBar" class="app-shell">
		<NavBar />
		<main class="app-main" :class="{ 'app-main--contained': route.meta.containedScroll }">
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
	<router-view v-else v-slot="{ Component, route: viewRoute }">
		<transition name="route-fade" mode="out-in">
			<component
				:is="Component"
				:key="['guides', 'news'].includes(viewRoute.name) ? viewRoute.name : viewRoute.fullPath"
			/>
		</transition>
	</router-view>
	<OnboardingGuide />
</template>


<script setup>
import NavBar from './components/NavBar.vue';
import OnboardingGuide from './components/OnboardingGuide.vue'
import {computed, onBeforeUnmount, onMounted, watch} from "vue";
import {useRoute} from "vue-router";
import {hasPendingOnboardingPrompt, hasSeenOnboarding, useOnboardingGuide} from '@/composables/useOnboardingGuide.js'
const route = useRoute();
const showNavBar = computed(() => route.meta.showNavBar !== false);
const {openPrompt} = useOnboardingGuide()
let onboardingPromptTimer = 0

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
	if (import.meta.env.PROD) {
		document.addEventListener('contextmenu', e => e.preventDefault());
		document.addEventListener('dragstart', e => e.preventDefault());
		document.addEventListener('copy', e => e.preventDefault());
		document.addEventListener('selectstart', e => e.preventDefault());
		document.addEventListener('keydown', function (e) {
			if (
				e.key === 'F12' ||
				(e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') ||
				(e.ctrlKey && e.key.toLowerCase() === 'u')
			) {
				e.preventDefault();
			}
		});
	}

	scheduleOnboardingPrompt()
});

watch(() => route.path, scheduleOnboardingPrompt)

onBeforeUnmount(() => {
	if (onboardingPromptTimer) {
		window.clearTimeout(onboardingPromptTimer)
	}
})
</script>

<style>
@import "/src/assets/main.css";
* {
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
