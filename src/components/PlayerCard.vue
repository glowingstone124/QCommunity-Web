<template>
	<div class="player-info" :style="{backgroundImage:gradient}">
		<div
			:style="{
         height: cardHeight + 'px',
         width: cardHeight * 0.7 + 'px', //0.7*0.6
         overflow: 'hidden',

       }"
			class="card-wrapper"
			ref="wrapperRef"
		>
			<ArtCardForQueryUsage
				ref="cardRef"
				scale="0.6"
				:username="username"
				@ready="onCardReady"
			/>
		</div>
		<div class="informations">
			<span class="info">
				<img :src="avatar" alt="avatar" ref="avatarImg" crossorigin="anonymous" class="avatar"
					 @load="onImgLoad"/>
				<span style="display: flex; flex-direction: column;">
						<h1 :class="{ 'online-id': online }">{{ username }}</h1>
						<span v-if="qq"><p class="qq">UID: {{ qq }}</p></span>
				</span>
			</span>
			<div class="details">
				<span v-if="playtime" style="display: flex; align-items: center; gap: 4px;">
					<font-awesome-icon icon="fa-regular fa-clock"/>
					<span class="playtime">{{ playtime }} 分钟</span>
				</span>
				<span>
				<p
					class="status-text"
					:class="statusClass"
				> {{ statusText }}
			</p>
		</span>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import {ref, computed, watch, nextTick} from 'vue'
import ColorThief from 'colorthief'
import {isSpecialAvatar} from '@/utils/palette'
import ArtCardForQueryUsage from "@/components/ArtCardForQueryUsage.vue";

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

function onCardReady() {
	nextTick(() => {
		const el = cardRef.value?.$el as HTMLElement
		if (el) {
			cardWidth.value = el.offsetWidth * 0.6
			cardHeight.value = el.offsetHeight * 0.6
		}
	})
}

const cardRef = ref<InstanceType<typeof ArtCardForQueryUsage> | null>(null)
const wrapperRef = ref<HTMLElement | null>(null)
const cardWidth = ref<number | null>(null)
const cardHeight = ref<number | null>(null)

function extractColor() {
	const img = avatarImg.value
	if (!img) return

	try {
		const colorThief = new ColorThief()
		const palette = colorThief.getPalette(img, 5)
		const [, c2, c3] = palette

		const darken = (rgb, factor = 0.6) => rgb.map(v => Math.floor(v * factor))

		const darkC2 = darken(c2)
		const darkC3 = darken(c3)

		gradient.value = `linear-gradient(135deg, rgb(${darkC2.join(',')}), rgb(${darkC3.join(',')}))`
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
	{immediate: true}
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

.informations {
	color: white;
	display: flex;
	flex-direction: column;
	padding-left: 1.8rem;
	padding-right: 3.8rem;
}

.avatar {
	width: 120%;
	height: 120%;
	transform: scale(1.3);
	align-self: center;
	padding: 20px;
	margin: 0;
}

.status-text {
	background: rgba(231, 227, 227, 0.58);
	backdrop-filter: blur(20px);
	text-shadow: none !important;
	padding: 11px 13px;
	font-weight: 750;
	color: #f6f1f1 !important;
	border-radius: 13px;
}

.player-info {
	margin-top: 1vh;
	margin-left: 3vw;
	display: flex;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	flex-direction: row;
	align-items: center;
	justify-content: left;
	transition: all 0.5s ease;
	border-radius: 10px;
}

@media (max-width: 800px) {
	.player-info {
		display: flex;
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

.details {
	margin-top: 1vh;
	margin-left: 0.6rem;
}

h1 {
	font-size: 3rem;
	font-family: "Bahnschrift";
	margin: 0;
}

.info {
	display: flex;
	flex-direction: row;

	h1, p {
		color: white;
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
