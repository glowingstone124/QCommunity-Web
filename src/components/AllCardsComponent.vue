<script setup>
import { onMounted, ref, computed } from 'vue'
import axios from "axios"

const cards = ref([])

const rarityMap = {
  1: { name: "普通", style: "common" },
  2: { name: "稀有", style: "uncommon" },
  3: { name: "史诗", style: "rare" },
  4: { name: "限定", style: "limited" }
}

const correspondText = {
  "COMMON": 1,
  "UNCOMMON": 2,
  "RARE": 3,
  "LIMITED": 4
}

onMounted(async () => {
  const response = await axios.get("https://api.qoriginal.vip/qo/authorization/cards/all")
  let result = response.data
  result.forEach(card => {
    card.rarity = correspondText[card.rarity]
  })
  cards.value = result
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
        </div>
      </div>
         </span>
    </div>
  </div>
</template>


<style scoped>
@import "@/assets/browseCards.css";
</style>
