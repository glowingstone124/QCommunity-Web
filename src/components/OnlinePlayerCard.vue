<template>
	<div class="card" @click="toggleDetails">
		<span class="header">
			<div class="info">
				<img class="avatar" :src="avatar" alt="Player Avatar" />
				<p class="name">{{ player.name }}</p>
			</div>
			<span :class="['arrow', { 'arrow-up': isExpanded }]"></span>
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
import {defineProps, ref, onMounted, onBeforeUnmount} from 'vue';
let pollingInterval;
const isExpanded = ref(false);
const props = defineProps({
	player: {
		type: Object,
		required: true,
	}
});
function toggleDetails() {
	isExpanded.value = !isExpanded.value;
}

const avatar = ref('');

const detailsRef = ref<HTMLElement | null>(null);

async function getAvatar(name: string): Promise<string | undefined> {
	try {
		const response = await fetch(`https://api.glowingstone.cn/qo/download/avatar?name=${name}`);
		const data = await response.json();
		return data.url;
	} catch (error) {
		console.error("Error fetching avatar:", error);
		return undefined;
	}
}

async function doSomething() {
	const fetchedAvatar = await getAvatar(props.player.name);
	if (fetchedAvatar) {
		avatar.value = fetchedAvatar;
	}
}

function startPolling() {
	doSomething();
	pollingInterval = setInterval(doSomething, 1000);
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
	background-color: rgb(69, 114, 105);
	border-radius: 10px;
	padding: 20px;
	margin: auto;
	text-align: left;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	transition: all 0.2s;
	cursor: pointer;
}

.card:hover {
	background-color: rgb(75, 120, 110);
}

.avatar {
	width: 50px;
	height: 50px;
	margin-bottom: 10px;
	margin-right: 15px;
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

.arrow {
	width: 0;
	height: 0;
	border-left: 8px solid transparent;
	border-right: 8px solid transparent;
	border-top: 8px solid var(--text, white);
	transition: transform 0.3s ease;
}

.arrow-up {
	transform: rotate(180deg);
}
</style>

