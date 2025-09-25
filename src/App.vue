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
* {
	user-select: none;
	transition: all 0.3s ease-in-out;
}

input, textarea {
	user-select: text;
}

.app {
	max-height: 100vh;
}
.scroll-container {
	width: 300px;
	height: 200px;
	overflow-y: scroll;
}

::-webkit-scrollbar {
	width: 12px;
	background-color: rgba(0, 0, 0, 0.1);
}

::-webkit-scrollbar-track {
	background-color: #5a626800;
}

::-webkit-scrollbar-thumb {
	background-color: #6c757d;
	border-radius: 6px;
	border: 3px solid transparent;
}

::-webkit-scrollbar-thumb:hover {
	background-color: #5a6268;
}

.app {
	height: 100vh;
	background-color: #151a1f;
	overflow-y: hidden;
	overflow-x: hidden;
}

* {
	transition: all 0.3s ease-in-out;
}
</style>
