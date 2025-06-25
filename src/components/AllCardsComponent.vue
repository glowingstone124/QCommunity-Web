<script setup>
import { ref } from 'vue'

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
.gallery {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
	gap: 16px;
	padding: 16px;
}

.card {
	position: relative;
	border-radius: 10px;
	overflow: hidden;
	width: 250px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	transition: transform 0.2s ease;
	background-color: #000;
}

.card:hover {
	transform: scale(1.03);
}

.card img {
	width: 100%;
	height: auto;
	display: block;
	object-fit: cover;
}

.name-bar {
	position: absolute;
	bottom: 0;
	width: 100%;
	background: rgba(0, 0, 0, 0.6);
	padding: 6px 10px;
	color: white;
	font-family: "Bahnschrift", sans-serif;
}

.name-bar h3 {
	margin: 0;
	font-size: 0.95rem;
}

.overlay {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.6);
	opacity: 0;
	transition: opacity 0.3s ease;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	color: white;
	text-align: center;
	font-family: "Bahnschrift", sans-serif;
}

.card:hover .overlay {
	opacity: 1;
}

.overlay p {
	font-size: 0.85rem;
	margin: 0 0 6px 0;
}

.rarity {
	display: inline-block;
	padding: 2px 8px;
	border-radius: 6px;
	font-size: 0.8rem;
	color: black;
	font-weight: bold;
}


</style>
