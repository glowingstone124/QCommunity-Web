<script setup lang="ts">
import {ref, computed, watch, nextTick} from "vue"
import axios from "axios"
import ColorThief from 'colorthief'

const emits = defineEmits<{ ready: []; }>();
const props = defineProps({
	scale: {
		type: [Number],
		required: true,
		default: 1.0
	},
	username: {
		type: String,
		required: true,
	}
})

const statistics = ref<{ label: string, value: string }[]>([])
const uuid = ref("")
const avatarUrl = ref("")
const cardId = ref(0)

const gradient = ref("")
const avatarImg = ref<HTMLImageElement | null>(null)
function extractColor() {
	if (avatarImg.value) {
		const colorThief = new ColorThief()
		if (avatarImg.value.complete) {
			try {
				const color = colorThief.getPalette(avatarImg.value, 5)
				const [c1, c2, c3, c4, c5] = color
				gradient.value = `linear-gradient(135deg, rgb(${c2.join(',')}), rgb(${c3.join(',')}))`
			} catch (e) {
				console.error(e)
			}
		}
	}
}

function onImgLoad() {
	extractColor();
	checkReady();
}
async function queryAccountData(): Promise<number> {
	try {
		const res = await fetch("https://api.qoriginal.vip/qo/download/registry?name=" + props.username);
		const data = await res.json();
		uuid.value = data.profile_id;
		getAvatar(props.username).then((result: string) => {
			avatarUrl.value = result
		})
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

async function getAvatar(name: string): Promise<string | undefined> {
	try {
		const response = await fetch(`https://api.glowingstone.cn/qo/download/avatar?name=${name}`);
		const data = await response.json();
		if (data?.url) {
			return data.url;
		}
	} catch (error) {
		console.error('Error fetching avatar:', error);
	}
	return undefined;
}

async function getCardBg() {
	if (cardId.value > 0) {
		const response = await axios.get(`https://api.qoriginal.vip/qo/authorization/cards/info?id=${cardId.value}`);
		backgroundUrl.value = response.data.file_url;
		level.value = response.data.rarity;
		collection.value = response.data.special;
	} else {
		console.warn("cardId 无效");
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

watch(() => props.username, async (newName) => {
	if (newName && newName.trim() !== '') {
		await queryAccountData();
		await getCardBg();
	}
}, {immediate: true});

async function checkReady() {
	if (avatarUrl.value && backgroundUrl.value && statistics.value.length > 0) {
		await nextTick();
		emits("ready");
	}
}

watch([avatarUrl, backgroundUrl, statistics], () => {
	checkReady();
})
</script>

<template>
	<div
		class="wrapper"
		:style="{
			width: `${700 * props.scale}px`,
			height: `${1000 * props.scale}px`,
		}"
	>
		<div
			class="card-inner"
			:style="{
				transform: `scale(${props.scale})`,
				transformOrigin: 'left top',
			}"
		>
			<div class="background" :style="{ backgroundImage: `url('${backgroundUrl}')` }">
			<div class="top">
				<div class="section-1" :style="{backgroundImage: gradient}">
					<img :src="avatarUrl" alt="avatar" ref="avatarImg" crossorigin="anonymous"
						 @load="onImgLoad" />
				</div>
				<div class="section-4"><h1>{{ username }}</h1></div>
				<div class="section-1"></div>
			</div>
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
	</div>
</template>


<style scoped>
@import url('@/assets/artcard.css');

.wrapper {
	overflow: hidden;
}

.card-inner {
	width: 700px;
	height: 1000px;
}
</style>
