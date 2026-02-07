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
import ColorThief from 'colorthief'
const gradient = ref("")
const avatarImg = ref<HTMLImageElement | null>(null)
const statistics = ref<{ label: string, value: string }[]>([])
const username = ref("steve")
const uuid = ref("")
const avatarUrl = ref("")
const cardId = ref(0)
async function queryAccountData(): Promise<number> {
	try {
		const res = await fetch("/api/qo/authorization/account", {
			headers: {
				"token": localStorage.getItem("token"),
			}
		});
		const data = await res.json();
		username.value = data.username;
		uuid.value = data.profile_id;
		getAvatar(username.value).then((result: string) =>{
			avatarUrl.value = result
		})
		const cardRes = await axios.get("/api/qo/authorization/account/card?profileUuid=" + uuid.value);
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

const level = ref(0)

const levelDic = {
	1: "common",
	2: "uncommon",
	3: "rare",
	4: "limited",
}
const collection = ref("")

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
			const response = await axios.get(`/api/qo/authorization/cards/info?id=${card}`);
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
	extractColor()
}
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
				transformOrigin: 'top left',
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
				<div class="level" :class="levelDic[level]">
					<div class="cube"></div>
					<h2>{{ levelDesc[level] }}</h2>
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
