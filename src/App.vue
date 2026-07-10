<template>
	<div v-if="showNavBar" class="app-shell">
		<NavBar />
		<main class="app-main" :class="{ 'app-main--contained': route.meta.containedScroll }">
			<router-view />
		</main>
	</div>
	<router-view v-else />
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

input, textarea {
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

</style>
