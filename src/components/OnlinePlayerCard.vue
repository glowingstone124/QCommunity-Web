<template>
	<div class="card">
		<span style="display: flex; align-items: center; justify-content: center;">
		<img class="avatar" :src="avatar" alt="Player Avatar" />
		<p class="name">{{ player.name }}</p>
		</span>
		<p>Ping: {{ player.ping }}ms</p>
		<p>Health: {{ player.health }}</p>
		<p>位置: ({{ player.x }}, {{ player.y }}, {{ player.z }})</p>
	</div>
</template>

<script setup lang="ts">
import {defineProps, ref, onMounted, onBeforeUnmount} from 'vue';
let pollingInterval;
const props = defineProps({
	player: {
		type: Object,
		required: true,
	}
});

const avatar = ref('');

async function getAvatar(name: string): Promise<string | undefined> {
	try {
		const response = await fetch(`https://rock.glowingstone.cn/qo/download/avatar?name=${name}`);
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
	background-color: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.3);
	border-radius: 10px;
	padding: 20px;
	margin: 10px;
	min-width: 200px;
	text-align: left;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	transition: transform 0.2s;
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
</style>
