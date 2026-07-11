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
</template>


<script setup>
import NavBar from './components/NavBar.vue';
import {computed, onMounted} from "vue";
import {useRoute} from "vue-router";
const route = useRoute();
const showNavBar = computed(() => route.meta.showNavBar !== false);

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
});
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
	transition: opacity var(--motion-fast) var(--ease-standard), transform var(--motion-fast) var(--ease-standard);
}

.route-fade-enter-from {
	opacity: 0;
	transform: translateY(8px);
}

.route-fade-leave-to {
	opacity: 0;
	transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
	.route-fade-enter-active,
	.route-fade-leave-active {
		transition: none;
	}
}

</style>
