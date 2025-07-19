<script setup lang="ts">
import {onMounted, ref} from 'vue'
import axios from "axios";

function apply(cardId: number) {
	console.log("应用卡片", cardId)
	axios.post(`https://api.qoriginal.vip/qo/authorization/account/card/custom`,
		{cardId: cardId}
		, {
			headers: {
				"token": localStorage.getItem("token")
			}
		},
	)
}

const cards = ref([
	{
		name: "城市风光-主城1",
		id: 1,
		special: "City Collection",
		rarity: 2,
		file_url: "https://bucket.glowingstone.cn/cards/city_maincity_01.png"
	}
])
const rarityMap = {
	1: {name: "普通话", color: "#47c9da"},
	2: {name: "稀有", color: "#55CE85"},
	3: {name: "史诗", color: "#f10d0d"},
	4: {name: "限定", color: "#ff9800"}
}
onMounted(async () => {
	try {
		const response = await axios.get("https://api.qoriginal.vip/qo/authorization/cards/obtained", {
			headers: {
				token: localStorage.getItem("token")
			}
		})
		const infoPromises = response.data.map(item => {
			return axios.get(`https://api.qoriginal.vip/qo/authorization/cards/info?id=${item.cardId}`, {
				headers: {
					token: localStorage.getItem("token") || ""
				}
			})
		})
		const infoResponses = await Promise.all(infoPromises)

		cards.value = infoResponses.map(res => res.data)
	} catch (error) {
		console.error("获取卡片信息失败", error)
	}
})

</script>

<template>
	<div class="gallery">
		<div class="card" v-for="card in cards" :key="card.id">
			<img :src="card.file_url" :alt="card.name"/>
			<div class="name-bar">
				<h3>{{ card.name }}</h3>
			</div>
			<div class="overlay">
				<p>{{ card.special }}</p>
				<span
					class="rarity"
					:style="{ backgroundColor: rarityMap[card.rarity]?.color }"
				>
					{{ rarityMap[card.rarity]?.name || "未知" }}
				</span>
				<button class="apply" @click="apply(card.id)">应用</button>
			</div>
		</div>
	</div>
</template>


<style scoped>
@import "@/assets/browseCards.css";
.apply {
	z-index: 9999;
	margin-top: 5px;
	font-size: 0.8rem;
	border-radius: 6px;
	border: none;
	padding: 6px 10px;
	background-color: #3ca241;
}

.apply:hover {
	background-color: #4cb751;
	cursor: pointer;
}

</style>
