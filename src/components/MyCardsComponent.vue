<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
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

const cards = ref([])
const rarityMap = {
	1: { name: "普通", style: "common" },
	2: { name: "稀有", style: "uncommon" },
	3: { name: "史诗", style: "rare" },
	4: { name: "限定", style: "limited" }
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
const groupedCards = computed(() => {
  const groups = {}
  for (const card of cards.value) {
    if (!groups[card.special]) {
      groups[card.special] = []
    }
    groups[card.special].push(card)
  }
  return groups
})

</script>

<template>
  <div class="gallery">
    <div
        v-for="(group, special) in groupedCards"
        :key="special"
        class="card-group"
    >
      <span>
      <h2 class="group-title">{{ special }}</h2>
      </span>
      <span style="display: flex;flex-direction: row;gap: 16px;flex-wrap: wrap">
      <div class="card" v-for="card in group" :key="card.id">
        <img :src="card.file_url" :alt="card.name" />
        <div class="name-bar">
          <h3>{{ card.name }}</h3>
        </div>
        <div class="overlay">
          <p>{{ card.special }}</p>
          <span
              class="rarity"
              :class="rarityMap[card.rarity]?.style"
          >
						<p>{{ rarityMap[card.rarity]?.name || "未知" }}</p>
          </span>
          <button class="apply" @click="apply(card.id)">应用</button>
        </div>
      </div>
         </span>
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
