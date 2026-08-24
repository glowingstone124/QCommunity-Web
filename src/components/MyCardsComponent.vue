<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import axios from "axios";
import {getSpecialImage} from '/src/utils/cards.ts'
function apply(cardId: number) {
	console.log("应用卡片", cardId)
	axios.post(`https://api.qoriginal.vip/qo/authorization/account/card/custom`,
		{cardId: cardId}
		, {
			headers: {
				"token": localStorage.getItem("token")
			}
		},
	).then(()=>{window.location.reload()})
}

const cards = ref([])
const loading = ref(true)
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
	} finally {
		loading.value = false
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
  <div v-if="loading" class="card-loading" role="status" aria-label="正在加载卡片">
    <span v-for="index in 6" :key="index" class="card-loading-item"></span>
  </div>
  <div v-else class="gallery">
    <div
        v-for="(group, special) in groupedCards"
        :key="special"
        class="card-group"
    >
      <div class="card-group-heading">
       <img
		   v-if="getSpecialImage(special)"
		   :src="getSpecialImage(special)"
		   :alt="special"
		   style="height: 80px; vertical-align: middle;"
	   /><h2 class="group-title" v-else>{{ special }}</h2>
      </div>
      <div class="card-list">
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
	border-radius: 0;
	border: 1px solid var(--success);
	padding: 6px 10px;
	background-color: color-mix(in srgb, var(--success) 12%, transparent);
	color: var(--success);
	font-weight: 700;
	transition:
		background-color 0.18s ease,
		color 0.18s ease;
}

.card-list {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
	gap: 0.9rem;
}

:deep(.card-group) {
	border: 1px solid var(--border-soft);
	border-radius: 0;
	padding: 1.1rem;
	background: var(--glass-strong);
	margin-bottom: 0.85rem;
}

:deep(.group-title) {
	color: var(--title-color);
	font-size: 1rem;
	margin: 0 0 0.75rem;
}

.card-group-heading {
	min-height: 2.2rem;
	display: flex;
	align-items: center;
}

.card-group-heading img {
	max-width: min(100%, 240px);
	object-fit: contain;
}

.card-loading {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
	gap: 0.9rem;
}

.card-loading-item {
	aspect-ratio: 5 / 7;
	border: 1px solid var(--border-soft);
	background: linear-gradient(135deg, var(--surface-soft), color-mix(in srgb, var(--primary) 7%, var(--glass-soft)));
	animation: card-loading-pulse 1.1s var(--ease-in-out) infinite alternate;
}

@keyframes card-loading-pulse {
	from { opacity: 0.52; }
	to { opacity: 0.88; }
}

@media (prefers-reduced-motion: reduce) {
	.card-loading-item { animation: none; opacity: 0.7; }
}

@media (hover: hover) and (pointer: fine) {
	.apply:hover {
		background-color: var(--success);
		color: var(--button-primary-text);
		cursor: pointer;
	}
}

</style>
