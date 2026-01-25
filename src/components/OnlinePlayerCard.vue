<template>
	<div class="card" @click="toggleDetails">
		<span class="header">
			<div class="info">
				<img class="avatar" :src="avatar" alt="Player Avatar" />
				<p class="name">{{ player.name }}</p>
			</div>
		</span>

		<transition name="details-transition">
			<div v-show="isExpanded" class="details" ref="detailsRef">
				<p>Ping: {{ player.ping }}ms</p>
				<p>Health: {{ player.health }}</p>
				<p>位置: ({{ player.x }}, {{ player.y }}, {{ player.z }})</p>
			</div>
		</transition>
	</div>
</template>




<script setup lang="ts">
import { defineProps, ref, onMounted, onBeforeUnmount } from 'vue';

const avatarCache = new Map<string, string>();

let pollingInterval: number;
const isExpanded = ref(false);

const props = defineProps({
	player: {
		type: Object,
		required: true,
	},
});

function toggleDetails() {
	isExpanded.value = !isExpanded.value;
}

const avatar = ref('');
const detailsRef = ref<HTMLElement | null>(null);

async function getAvatar(name: string): Promise<string | undefined> {
	if (avatarCache.has(name)) {
		return avatarCache.get(name);
	}

	try {
		const response = await fetch(`https://api.glowingstone.cn/qo/download/avatar?name=${name}`);
		const data = await response.json();
		if (data?.url) {
			avatarCache.set(name, data.url);
			return data.url;
		}
	} catch (error) {
		console.error('Error fetching avatar:', error);
	}
	return undefined;
}

async function doSomething() {
	const fetchedAvatar = await getAvatar(props.player.name);
	if (fetchedAvatar) {
		avatar.value = fetchedAvatar;
	}
}

function startPolling() {
	doSomething();
	pollingInterval = window.setInterval(doSomething, 1000);
}

function stopPolling() {
	clearInterval(pollingInterval);
}

onMounted(() => {
	startPolling();
});

onBeforeUnmount(() => {
	stopPolling();
});

</script>

<style scoped>
.card {
	background-color: var(--card-background);
	border-radius: 10px;
	padding: 20px;
	margin: auto;
	text-align: left;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	transition: all 0.2s;
	cursor: pointer;
}

.card:hover {
	background-color: var(--background-secondary);
}
.info {
	display: flex;
	align-items: center;
	vertical-align: middle;
	justify-content: flex-start;
}
.avatar {
	width: 70px;
	height: 70px;
	margin: 0 10px;
	border-radius: 50%;
	box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
	border: 2px solid var(--split);
	object-fit: cover;
	transition: transform 0.3s ease, box-shadow 0.3s ease;
}


.name {
	font-weight: bold;
	font-size: 1.5rem;
}

.details {
	transition: max-height 0.5s ease;
}

p {
	font-family: 'Bahnschrift', 'NotoSans', serif;
}
.details-transition-enter-from,
.details-transition-leave-to {
	max-height: 0;
	opacity: 0;
	overflow: hidden;
}
.details-transition-enter-active,
.details-transition-leave-active {
	transition: all 0.4s ease;
}
.details-transition-enter-to,
.details-transition-leave-from {
	max-height: 500px; /* 根据实际内容设定 */
	opacity: 1;
}
</style>
