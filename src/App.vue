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
#app {
	height: 100vh;
	background-color: #2c6673;
	//padding-left: 2vw;
	//padding-right: 2vw;
	overflow-y: hidden;
	overflow-x: hidden;
}
* {
	transition: all 0.3s ease-in-out;
}
</style>
