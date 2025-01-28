<script setup>
import { ref, computed } from "vue";

const level = ref("rare");
const levelColors = {
	rare: "#47c9da",
	normal: "#55CE85",
	epic: "#f10d0d",
};

const backgroundColor = ref("#000000");

const textColor = computed(() => {
	const bg = backgroundColor.value;
	const r = parseInt(bg.slice(1, 3), 16);
	const g = parseInt(bg.slice(3, 5), 16);
	const b = parseInt(bg.slice(5, 7), 16);

	const brightness = (r * 299 + g * 587 + b * 114) / 1000;

	return brightness > 128 ? "#000000" : "#FFFFFF";
});
</script>


<template>
	<div class="background">
		<div class="main">
			<div class="statistics" :style="{ color: textColor }">
				<h2>Statistics1</h2>
				<p>999999</p>
			</div>
			<div class="statistics" :style="{ color: textColor }">
				<h2>Statistics2</h2>
				<p>999999</p>
			</div>
			<div class="statistics" :style="{ color: textColor }">
				<h2>Statistics3</h2>
				<p>999999</p>
			</div>
		</div>
		<div class="information">
			<h1>PlayerName</h1>
			<div class="level">
				<div
					class="cube"
					:style="{ background: levelColors[level] }"
				></div>
				<h2 :style="{ color: levelColors[level] }">Rare</h2>
			</div>
		</div>
	</div>
</template>


<style scoped>
@import "src/assets/main.css";

.statistics {
	h2,p {
		color: white;
		text-shadow: rgba(0, 0, 0, 0.25) 0px 54px 55px, rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px;
		font-family: "Bahnschrift", sans-serif;
	}
}

.background {
	background: #000000 url("https://storage.glowingstone.cn/download/instant_blue.jpg") center center no-repeat;
	width: 500px;
	display: flex;
	flex-direction: column;
	height: 780px;
}

.main {
	margin-left: 30px;
	flex: 8;
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
}

.statistics {
	text-align: left;
}

.information {
	padding: 20px;
	flex: 2;
	h1 {
		font-family: "Bahnschrift", sans-serif;
		color: white;
	}

	background-color: rgba(0, 0, 0, 0.73);
}

.cube {
	width: 1rem;
	rotate: 45deg;
	margin: 5px 20px;
	height: 1rem;
}

.level {
	align-items: center;
	display: flex;
	flex-direction: row;
	h2 {
		margin: 0;
	}
}
</style>

