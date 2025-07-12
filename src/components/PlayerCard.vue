<template>
	<div class="player-info" :style="{backgroundImage:gradient, color: textColor}">
		<img :src="avatar" alt="avatar"  ref="avatarImg" crossorigin="anonymous"
			 @load="onImgLoad" />
		<span class="info">
			<h1 :class="{ 'online-id': online }">{{ username }}</h1>
			<span v-if="qq"><p class="qq">UID: {{ qq }}</p></span>
			<span v-if="playtime"><p class="playtime">游玩时间: {{ playtime }} 分钟</p></span>
			<span>
				<p :style="{ color: banned ? 'red' : 'var(--text)' }">
					{{ banned ? '被封禁' : (online ? '正在游玩' : '当前离线') }}
				</p>
			</span>
		</span>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import ColorThief from "colorthief";

const props = defineProps<{
	username: string
	avatar?: string
	banned: boolean
	online: boolean
	qq: string
	found: boolean
	playtime: number
}>()

const avatarImg = ref<HTMLImageElement | null>(null)
const gradient = ref<string>("rgba(0,255,0,1)")

function extractColor() {
	if (avatarImg.value && avatarImg.value.complete) {
		try {
			const colorThief = new ColorThief()
			const color = colorThief.getPalette(avatarImg.value, 5)
			const [c1, c2, c3] = color
			textColor.value = getContrastColor(c2)
			gradient.value = `linear-gradient(135deg, rgb(${c2.join(',')}), rgb(${c3.join(',')}))`
		} catch (e) {
			console.error('颜色提取失败', e)
		}
	}
}

function onImgLoad() {
	extractColor()
}
const textColor = ref<string>('var(--text)')

function getContrastColor([r, g, b]: [number, number, number]): string {
	const yiq = (r * 299 + g * 587 + b * 114) / 1000
	return yiq >= 128 ? ' #21420e' : 'white'
}
</script>


<style scoped>
@import "/src/assets/main.css";
.player-info {
	max-width: 100%;
	padding: 0.4vw;
	display: flex;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	flex-direction: row;
	align-items: center;
	transition: all 0.5s ease;
	border-radius: 10px;
}

@media (max-width: 800px) {
	.player-info {
		flex-direction: column;
		padding: 10px;
	}
	.qq, h1, p {
		font-size: 18px;
	}
	img {
		width: 60px;
	}
}

h1 {
	font-size: 3rem;
	font-family: "Bahnschrift";
	margin: 0;
}
.info {
	display: flex;
	flex-direction: column;
}
span {
	display: flex;
	flex-direction: row;
}
img {
	max-width: 80px;
	margin-right: 30px;
	border-radius: 5px;
}
.qq {
	font-size: 22px;
	font-family: "Bahnschrift";
}
.playtime {
	font-family: "Bahnschrift";
}
@keyframes gradientAnimation {
	0% {
		background-position: 0% 0%;
	}
	100% {
		background-position: 100% 0%;
	}
}
@font-face {
	font-family: "Bahnschrift";
	src: url("/src/assets/bahnschrift.ttf");
}
p {
	margin: 5px;
}
</style>
