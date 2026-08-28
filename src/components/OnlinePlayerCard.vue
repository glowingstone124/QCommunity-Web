<template>
	<div class="card" @click="toggleDetails">
		<span class="header">
			<div class="info">
					<img class="avatar" :src="avatar" :alt="t('legacyPlayer.avatarAlt')" />
				<p class="name">{{ player.name }}</p>
			</div>
		</span>

		<transition name="details-transition">
			<div v-show="isExpanded" class="details" ref="detailsRef">
				<p>{{ t('legacyPlayer.ping', { value: player.ping }) }}</p>
				<p>{{ t('legacyPlayer.health', { value: player.health }) }}</p>
				<p>{{ t('legacyPlayer.position', { x: player.x, y: player.y, z: player.z }) }}</p>
			</div>
		</transition>
	</div>
</template>




<script setup lang="ts">
import { defineProps, ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n'
import { fetchAvatarUrl } from '@/services/avatar.js'

const avatarCache = new Map<string, string>();

let pollingInterval: number;
const isExpanded = ref(false);

const props = defineProps({
	player: {
		type: Object,
		required: true,
	},
});
const { t } = useI18n()

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
		const url = await fetchAvatarUrl(name)
		if (url) {
			avatarCache.set(name, url);
			return url;
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
	border: 2px solid var(--split);
	object-fit: cover;
	transition: transform 0.3s ease;
}


.name {
	font-weight: bold;
	font-size: 1.5rem;
}

.details {
	transition: max-height 0.5s ease;
}

p {
	font-family: 'Bahnschrift', 'PingFang SC', 'Microsoft YaHei', sans-serif;
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
