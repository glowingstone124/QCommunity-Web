<template>
	<div class="player-info" :style="{backgroundImage:gradient}">
		<img :src="avatar" alt="avatar" ref="avatarImg" crossorigin="anonymous"
			 @load="onImgLoad"/>
		<span class="info">
			<h1 :class="{ 'online-id': online }">{{ username }}</h1>
			<span v-if="qq"><p class="qq">UID: {{ qq }}</p></span>
			<span v-if="playtime"><p class="playtime">游玩时间: {{ playtime }} 分钟</p></span>
			<span>
				<p
					class="status-text"
					:class="statusClass"
				> {{ statusText }}
			</p>

			</span>
		</span>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ColorThief from 'colorthief'
import { isSpecialAvatar } from '@/utils/palette'

interface Props {
	username: string
	avatar?: string
	banned: boolean
	online: boolean
	qq?: string
	found?: boolean
	playtime?: number
}

const props = defineProps<Props>()
const avatarImg = ref<HTMLImageElement | null>(null)
const gradient = ref<string>(
	'linear-gradient(45deg,#64816c 0%, #64816c 100%)'
)

function extractColor() {
	const img = avatarImg.value
	if (!img) return
	try {
		const colorThief = new ColorThief()
		const palette = colorThief.getPalette(img, 5)
		const [, c2, c3] = palette
		gradient.value = `linear-gradient(135deg, rgb(${c2.join(',')}), rgb(${c3.join(',')}))`
	} catch (e) {
		console.error('颜色提取失败', e)
	}
}

async function onImgLoad() {
	if (!props.avatar) return
	const special = await isSpecialAvatar(props.username)
	if (special) {
		extractColor()
	} else {
		gradient.value = 'linear-gradient(45deg,#64816c 0%, #64816c 100%)'
	}
}

const statusText = computed(() => {
	if (props.banned) return '被封禁'
	return props.online ? '当前在线' : '当前离线'
})

const statusClass = computed(() => ({
	'status-banned': props.banned,
	'status-online': !props.banned && props.online,
	'status-offline': !props.banned && !props.online
}))

watch(
	() => [props.avatar, props.username],
	() => {
		if (avatarImg.value && props.avatar) {
			onImgLoad()
		}
	},
	{ immediate: true }
)
</script>

<style scoped>
@import "/src/assets/main.css";
.status-online {
	background: rgba(67, 252, 17, 0.58) !important;
}
.status-offline {

}
.status-banned {
	background: rgba(252, 17, 44, 0.58) !important;
}
.status-text{
	background: rgba(231, 227, 227, 0.58);
	backdrop-filter: blur(20px);
	text-shadow: none !important;
	padding: 11px 13px;
	font-weight: 750;
	color: #f6f1f1 !important;
	border-radius: 13px;
}
.player-info {
	max-width: 100%;
	padding: 2rem;
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

	h1, p {
		color: white;
		text-shadow: rgba(0, 0, 0, 0.19) 0px 2px 6px, rgba(0, 0, 0, 0.23) 0px 7px 6px;
	}
}

span {
	display: flex;
	flex-direction: row;
}

img {
	max-width: 80px;
	margin-right: 30px;
	border-radius: 20px;
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
