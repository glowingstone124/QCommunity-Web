<template>
	<div id="app">
		<router-view />
	</div>
</template>

<script>
export default {
	name: 'App'
}
</script>

<style>
@import "/src/assets/main.css";
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
	background-color: var(--background);
}

::-webkit-scrollbar-thumb {
	background-color: #6c757d;
	border-radius: 6px;
	border: 3px solid transparent;
}

::-webkit-scrollbar-thumb:hover {
	background-color: #5a6268;
}
#app {
	max-height: 100vh;
	background-color: #111010;
}
</style>
