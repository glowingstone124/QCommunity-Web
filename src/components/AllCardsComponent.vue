<script setup>
import {onMounted, ref} from 'vue'
import axios from "axios";

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
	1: { name: "普通话", color: "#47c9da" },
	2: { name: "稀有", color:  "#55CE85" },
	3: { name: "史诗", color: "#f10d0d" },
	4: { name: "限定", color:  "#ff9800" }
}

const correspondText = {
	"COMMON": 1,
	"UNCOMMON": 2,
	"RARE": 3,
	"LIMITED": 4
}
onMounted(async () => {
	axios.get("https://api.qoriginal.vip/qo/authorization/cards/all").then((response) => {
		let result = response.data
		result.forEach((card) => {
			card.rarity = correspondText[card.rarity]
		})
		cards.value = result
	})
})


</script>

<template>
	<div class="gallery">
		<div class="card" v-for="card in cards" :key="card.id">
			<img :src="card.file_url" :alt="card.name" />
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
			</div>
		</div>
	</div>
</template>


<style scoped>
@import "@/assets/browseCards.css";
</style>
