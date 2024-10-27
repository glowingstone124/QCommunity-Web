<script setup lang="ts">
import { useRouter } from "vue-router";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { get } from "/src/utils/request";
import PlayerCard from "@/components/OnlinePlayerCard.vue";
const route = useRouter();
let pollingInterval;

const onlinecount = ref(0);
const totalcount = ref(0);
const mspt = ref(0.00);
const players = ref([]);

function redirect() {
	route.push('/');
}

function fetchData() {
	get("https://api.glowingstone.cn/qo/download/status").then(result => {
		onlinecount.value = result.onlinecount;
		players.value = result.players;
		totalcount.value = result.totalcount;
		mspt.value = result.mspt;
	});
}

function startPolling() {
	fetchData();
	pollingInterval = setInterval(fetchData, 1000);
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

<template>
	<div class="dashboard">
		<div style="flex: 3; display: flex; flex-direction: column; align-items: center;">
			<h1>仪表板</h1>
			<span class="redirect" @click="redirect">
				<p class="arrow"><</p> <p>回到首页</p>
			</span>
		</div>
		<div style="margin-left: 10vw; flex: 2">
			<h2>在线人数</h2>
			<p class="display">{{ onlinecount }}</p>
			<h2>总帐号数</h2>
			<p class="display">{{ totalcount }}</p>
			<h2>MSPT(realtime)</h2>
			<p class="display">{{ mspt }}</p>
		</div>
		<div style="margin-left: 7vw; flex: 5">
			<h2>玩家列表</h2>
			<ul>
				<div class="player-cards">
					<PlayerCard v-for="player in players" :key="player.name" :player="player" />
				</div>
			</ul>
		</div>
	</div>
</template>

<style scoped>
@import "src/assets/base.css";
@import "src/assets/main.css";

.dashboard {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
	flex-direction: row;
	text-align: center;
}

h1, p, h2, ul, li {
	color: var(--text);
}

h1 {
	font-size: 5rem;
	font-weight: 200;
}

h2 {
	font-size: 2rem;
	font-weight: 200;
}

.redirect {
	display: flex;
	align-items: center;
	flex-direction: row;
	cursor: pointer;
	margin-top: 20px;
}

.redirect:hover .arrow {
	margin-right: 20px;
}

.arrow {
	margin-right: 8px;
}

.display {
	font-family: 'Bahnschrift';
	font-size: 1.4rem;
}

.player-cards {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
}
</style>
