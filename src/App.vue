<template>
	<div id="app" :style="{ backgroundImage: gradientStyle }">
		<router-view/>
	</div>
</template>

<script setup>
/*
const angle = ref(120);
const animating = ref(true);

const gradientStyle = computed(() => {
	return `linear-gradient(${angle.value}deg, #A5CC82 0%, #00467F 100%)`;
});

const changeGradientAngle = () => {
	if (animating.value) {
		angle.value = (angle.value + 0.1) % 360;
		requestAnimationFrame(changeGradientAngle);
	}
};

onMounted(() => {
	changeGradientAngle();
});

onBeforeUnmount(() => {
	animating.value = false
});
 */
</script>

<style>
@import "/src/assets/main.css";
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

#app {
	height: 100vh;
	background: #587958;
	overflow-y: hidden;
	overflow-x: hidden;
}

* {
	transition: all 0.3s ease-in-out;
}
</style>
