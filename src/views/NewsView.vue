<script setup>
const getRandomShadow = () => {
	const intensity = Math.random() * 0.3 + 0.1; // 设定阴影强度范围
	const offsetX = Math.random() * 40 - 5; // 随机的X轴偏移
	const offsetY = Math.random() * 7 -3;
	return `rgba(20, 12, 40, ${intensity}) ${offsetX}px ${offsetY}px 30px 0px`;
};

const itemCount = Math.ceil((window.innerWidth / 200) * (window.innerHeight / 200));
</script>

<template>
	<div class="grid-container">
		<div class="grid-item" v-for="n in itemCount" :key="n" :style="{ boxShadow: getRandomShadow() }">{{  }}</div>
	</div>
</template>

<style scoped>
html, body {
	margin: 0;
	height: 100%;
}

.grid-container {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	height: 100vh;
	gap: 0;
	background-color: white;
}

.grid-item {
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	aspect-ratio: 1 / 1;
}
</style>
