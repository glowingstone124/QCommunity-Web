<template>
	<div v-if="showNavBar" class="app">
		<NavBar />
		<router-view />
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
.app {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	background-color: var(--background);
	overflow-x: hidden;
}
</style>
