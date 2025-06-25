<script setup>
import {ref, computed, onMounted} from "vue"
import axios from "axios"

const props = defineProps({
	id: {
		type: [String, Number],
		required: true,
	},
	scale: {
		type: [Number],
		required: true,
		default: 1.0
	}
})

const username = ref("steve")

function queryAccountData() {
	fetch("https://api.qoriginal.vip/qo/authorization/account", {
		headers: {
			"token": localStorage.getItem("token"),
		}
	}).then(res => res.json())
		.then(data => {
			username.value = data.username;
		});
}
const level = ref(0)

const collection = ref("")

const levelColors = {
	1: "#47c9da",
	2: "#55CE85",
	3: "#f10d0d",
	4: "#ff9800",
}

const levelDesc = {
	1: "Common",
	2: "Uncommon",
	3: "Rare",
	4: "Limited",
}
const backgroundUrl = ref("")

const textColor = computed(() => {
	const r = 0, g = 0, b = 0
	const brightness = (r * 299 + g * 587 + b * 114) / 1000
	return brightness > 128 ? "#000000" : "#FFFFFF"
})

onMounted(async () => {
	try {
		queryAccountData()
		const response = await axios.get(`https://api.qoriginal.vip/qo/authorization/cards/info?id=${props.id}`)
		backgroundUrl.value = response.data.file_url
		level.value = response.data.rarity
		collection.value = response.data.special
	} catch (err) {
		console.error("获取卡片信息失败：", err)
	}
})
</script>


<template>
	<div
		class="wrapper"
		:style="{
			transform: `scale(${props.scale})`,
			transformOrigin: 'top left',
		}"
	>
		<div class="background" :style="{ backgroundImage: `url('${backgroundUrl}')` }">
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
				<h1>{{ username }}</h1>
				<div class="from">
					<p>{{ collection }}</p>
				</div>
				<div class="level">
					<div class="cube" :style="{ background: levelColors[level] }"></div>
					<h2 :style="{ color: levelColors[level] }">{{ levelDesc[level] }}</h2>
				</div>
			</div>
		</div>
	</div>
</template>


<style scoped>
@import "src/assets/main.css";

.statistics {
	h2, p {
		color: white;
		text-shadow: rgba(0, 0, 0, 0.25) 0px 54px 55px, rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px;
		font-family: "Bahnschrift", sans-serif;
	}
}

.background {
	background: #000000 center no-repeat;
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
	padding-top: 20px;
	padding-bottom: 30px;
	padding-left: 30px;
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
	margin-right:10px;
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

.from {
	p {
		display: inline-block;
		background-color: #39bd59;
		color: black;
		font-family: "Bahnschrift", sans-serif;
		padding: 0.25em 0.5em;
		margin-bottom: 0.5rem;
		margin-top: -0.1rem;
	}
}

</style>

