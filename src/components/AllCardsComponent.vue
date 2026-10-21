<script setup>
import { onBeforeUnmount, onMounted, ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from "axios"
import {getSpecialImage, groupCardsBySpecial, rarityMap} from "/src/utils/cards.ts";
import { readCardCatalogCache, writeCardCatalogCache } from '@/utils/cardCatalogCache.js'

const cards = ref([])
const { t } = useI18n()
const loading = ref(true)
const visibleImageIds = ref(new Set())
let imageObserver = null

const correspondText = {
  "COMMON": 1,
  "UNCOMMON": 2,
  "RARE": 3,
  "LIMITED": 4
}

function normalizeCards(result) {
  return result.map((card) => ({
    ...card,
    rarity: correspondText[card.rarity] || card.rarity,
  }))
}

function imageIsVisible(cardId) {
  return visibleImageIds.value.has(String(cardId))
}

async function observeCardImages() {
  await nextTick()
  imageObserver?.disconnect()

  const cardElements = document.querySelectorAll('.all-cards-catalog [data-card-id]')
  if (!('IntersectionObserver' in window)) {
    visibleImageIds.value = new Set([...cardElements].map((card) => card.dataset.cardId))
    return
  }

  imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      const cardId = entry.target.dataset.cardId
      visibleImageIds.value = new Set([...visibleImageIds.value, cardId])
      imageObserver?.unobserve(entry.target)
    })
  }, { rootMargin: '420px 0px', threshold: 0.01 })

  cardElements.forEach((card) => imageObserver.observe(card))
}

function setCards(nextCards) {
  cards.value = nextCards
  observeCardImages()
}

onMounted(async () => {
  const cachedCards = readCardCatalogCache()
  if (cachedCards) {
    setCards(cachedCards)
    loading.value = false
  }

  try {
    const response = await axios.get("https://api.qoriginal.vip/qo/authorization/cards/all")
    const result = normalizeCards(response.data)
    writeCardCatalogCache(result)
    setCards(result)
  } catch (error) {
    console.error('获取卡片信息失败', error)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => imageObserver?.disconnect())

const groupedCards = computed(() => groupCardsBySpecial(cards.value))
</script>

<template>
  <div v-if="loading" class="card-loading" role="status" :aria-label="t('cardsPage.loadingAria')">
    <span v-for="index in 6" :key="index" class="card-loading-item"></span>
  </div>
  <div v-else class="gallery all-cards-catalog">
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
      <div class="card" v-for="card in group" :key="card.id" :data-card-id="card.id">
        <img
          v-if="imageIsVisible(card.id)"
          :src="card.file_url"
          :alt="card.name"
          loading="lazy"
          decoding="async"
        />
        <div v-else class="card-image-placeholder" aria-hidden="true">#{{ card.id }}</div>
        <div class="name-bar">
          <h3>{{ card.name }}</h3>
        </div>
        <div class="overlay">
          <p>{{ card.special }}</p>
          <span
              class="rarity"
              :class="rarityMap[card.rarity]?.style"
          >
						<p>{{ t(`cardsPage.${rarityMap[card.rarity]?.style || 'unknownRarity'}`) }}</p>
          </span>
        </div>
      </div>
         </div>
    </div>
  </div>
</template>

<style scoped>
@import "@/assets/browseCards.css";
</style>

<style scoped src="@/assets/cardCatalog.css"></style>
