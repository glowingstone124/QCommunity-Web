<template>
	<div v-if="showNavBar" class="app-shell">
		<NavBar />
		<main class="app-main">
			<router-view />
		</main>
	</div>
	<router-view v-else />
</template>


<script setup>
import NavBar from './components/NavBar.vue';
import {computed, onMounted} from "vue";
import {useRoute, useRouter} from "vue-router";
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
	width: 12px;
	background-color: var(--split);
}

::-webkit-scrollbar-track {
	background-color: transparent;
}

::-webkit-scrollbar-thumb {
	background-color: var(--text-secondary);
	border-radius: 6px;
	border: 3px solid transparent;
}

::-webkit-scrollbar-thumb:hover {
	background-color: var(--text-main);
}

.app-shell {
	height: 100dvh;
	background-color: var(--background);
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.app-main {
	width: 100%;
	flex: 1;
	min-height: 0;
	overflow: auto;
	overflow-x: hidden;
}

* {
	transition: all 0.3s ease-in-out;
}
</style>
