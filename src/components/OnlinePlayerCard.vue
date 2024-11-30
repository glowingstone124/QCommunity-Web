<template>
	<div class="card" @click="toggleDetails">
		<span style="display: flex; align-items: center; justify-content: space-between;">
			<div style="display: flex; align-items: center;">
				<img class="avatar" :src="avatar" alt="Player Avatar" />
				<p class="name">{{ player.name }}</p>
			</div>
			<span :class="['arrow', { 'arrow-up': isExpanded }]"></span>
		</span>

		<div v-show="isExpanded" class="details">
			<p>Ping: {{ player.ping }}ms</p>
			<p>Health: {{ player.health }}</p>
			<p>位置: ({{ player.x }}, {{ player.y }}, {{ player.z }})</p>
		</div>
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
	transition: transform 0.2s, background-color 0.3s;
	cursor: pointer;
}

.card:hover {
	transform: scale(1.05);
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

/* 箭头样式 */
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

