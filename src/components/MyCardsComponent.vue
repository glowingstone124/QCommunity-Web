<script setup lang="ts">
import UiButton from "@/components/ui/UiButton.vue"
import {computed, onMounted, ref} from 'vue'
import { useI18n } from 'vue-i18n'
import axios from "axios";
import {getSpecialImage, groupCardsBySpecial, rarityMap} from '/src/utils/cards.ts'
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
const { t } = useI18n()
const loading = ref(true)

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
const groupedCards = computed(() => groupCardsBySpecial(cards.value))

</script>

<template>
  <div v-if="loading" class="card-loading" role="status" :aria-label="t('cardsPage.loadingAria')">
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
	   /><h4 class="group-title" v-else>{{ special }}</h4>
      </div>
      <div class="card-list">
      <div class="card" v-for="card in group" :key="card.id">
        <img :src="card.file_url" :alt="card.name" />
        <div class="name-bar">
          <p class="card-name">{{ card.name }}</p>
        </div>
        <div class="overlay">
          <p>{{ card.special }}</p>
          <span
              class="rarity"
              :class="rarityMap[card.rarity]?.style"
          >
						<p>{{ t(`cardsPage.${rarityMap[card.rarity]?.style || 'unknownRarity'}`) }}</p>
          </span>
          <UiButton type="button" size="sm" variant="filled" class="apply" @click="apply(card.id)">{{ t('cardsPage.apply') }}</UiButton>
        </div>
      </div>
         </div>
    </div>
  </div>
</template>

<style scoped>
@import "@/assets/browseCards.css";
:global(:root[data-ui="modern"] .card-list .card .overlay .apply) {
	z-index: 2;
	margin-top: 0.35rem;
}

:global(:root:not([data-ui="modern"]) .card-list .card .overlay .apply) {
	z-index: 9999;
	margin-top: 5px;
	font-size: 0.8rem;
	border-radius: 0;
	border: 1px solid var(--success);
	padding: 6px 10px;
	background-color: color-mix(in srgb, var(--success) 12%, transparent);
	color: var(--success-text);
	font-weight: 700;
	transition:
		background-color 0.18s var(--ease-out),
		color 0.18s var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
	:global(:root:not([data-ui="modern"]) .card-list .card .overlay .apply:hover) {
		background-color: var(--success-solid);
		color: #fff;
		cursor: pointer;
	}
}

</style>

<style scoped src="@/assets/cardCatalog.css"></style>
