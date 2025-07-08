<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import axios from "axios"

const props = defineProps({
	scale: {
		type: [Number],
		required: true,
		default: 1.0
	}
})


const statistics = ref<{ label: string, value: string }[]>([])
const username = ref("steve")
const uuid = ref("")
const cardId = ref(0)
async function queryAccountData(): Promise<number> {
	try {
		const res = await fetch("https://api.qoriginal.vip/qo/authorization/account", {
			headers: {
				"token": localStorage.getItem("token"),
			}
		});
		const data = await res.json();
		username.value = data.username;
		uuid.value = data.profile_id;

		const cardRes = await axios.get("https://api.qoriginal.vip/qo/authorization/account/card?profileUuid=" + uuid.value);
		const cardData = cardRes.data;
		cardId.value = cardData.cardId;
		const rawStats = cardData.statistic
		statistics.value = rawStats.map(obj => {
			const key = Object.keys(obj)[0]
			return {
				label: key || "--",
				value: obj[key] || "0"
			}
		})

		return cardId.value;
	} catch (err) {
		console.error("请求失败：", err);
		return 0;
	}
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
		const card = await queryAccountData();
		if (card > 0) {
			const response = await axios.get(`https://api.qoriginal.vip/qo/authorization/cards/info?id=${card}`);
			backgroundUrl.value = response.data.file_url;
			level.value = response.data.rarity;
			collection.value = response.data.special;
		} else {
			console.warn("cardId 无效");
		}
	} catch (err) {
		console.error("获取卡片信息失败：", err);
	}
});

</script>

<template>
	<div
		class="wrapper"
		:style="{
			transform: `scale(${props.scale})`,
			transformOrigin: 'top left',
		}"
	>
		<div class="top">
			<div class="section-1"></div>
			<div class="section-4"><h1>{{ username }}</h1></div>
			<div class="section-1"></div>
		</div>
		<div class="background" :style="{ backgroundImage: `url('${backgroundUrl}')` }">
			<div class="main">
				<div class="statistics" v-for="(stat, index) in statistics" :key="index" :style="{ color: textColor }">
					<h2>{{ stat.label }}</h2>
					<p>{{ stat.value }}</p>
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
		color: #ffffff;
		text-shadow: rgba(0, 0, 0, 0.25) 0px 54px 55px, rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px;
		font-family: "Bahnschrift", sans-serif;
	}
}

.background {
	background: #000000 center no-repeat;
	width: 540px;
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

.top {
	min-height: 6rem;
	max-width: 100%;
	background-color: #39bd59;
	display: flex;
}

.section-1 {
	flex: 1;
}

.section-4 {
	display: table;
	text-align: center;
	flex: 4;
	h1{
		display: table-cell;
		vertical-align: middle;
	}
}
.wrapper {
	max-width: 540px;
}
</style>

