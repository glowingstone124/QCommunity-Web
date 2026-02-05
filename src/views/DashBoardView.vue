<script setup >
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
const currentServerId = ref(1)

function redirect() {
	route.push('/');
}

let isFetching = false;

function fetchData() {
	if (isFetching) return;
	isFetching = true;

	get("https://api.glowingstone.cn/qo/download/status?id=" + currentServerId.value).then(result => {
		onlinecount.value = result.onlinecount;
		players.value = result.players;
		totalcount.value = result.totalcount;
		mspt.value = result.mspt.toFixed(2);
	}).finally(() => {
		isFetching = false;
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
		<header class="dashboard-header">
			<div>
				<p class="eyebrow">服务器概览</p>
				<h1>仪表板</h1>
				<p class="sub">实时查看在线状态与核心指标。</p>
				<button class="redirect" @click="redirect">
					<span class="arrow">‹</span>
					<span>回到首页</span>
				</button>
			</div>
			<div class="select">
				<button @click="currentServerId = 1" :class="currentServerId === 1 ? 'active' : ''">生存服</button>
				<button @click="currentServerId = 4" :class="currentServerId === 4 ? 'active' : ''">创造服</button>
			</div>
		</header>

		<section class="panel-group">
			<div class="panel">
				<h2>在线人数</h2>
				<p class="display">{{ onlinecount }}</p>
			</div>
			<div class="panel">
				<h2>总帐号数</h2>
				<p class="display">{{ totalcount }}</p>
			</div>
			<div class="panel">
				<h2>MSPT(realtime)</h2>
				<p class="display">{{ mspt }}</p>
			</div>
		</section>

		<section class="players">
			<div class="section-head">
				<h2>{{ onlinecount !== 0 ? "玩家列表" : "暂无玩家" }}</h2>
				<span class="count">{{ onlinecount }}</span>
			</div>
			<div class="player-cards" v-if="players.length">
				<PlayerCard v-for="player in players" :key="player.name" :player="player"/>
			</div>
			<p v-else class="empty">当前没有在线玩家。</p>
		</section>
	</div>
</template>

<style scoped>
@import "@/assets/base.css";
@import "@/assets/main.css";

.dashboard {
	min-height: calc(100vh - 60px);
	color: var(--text);
	display: flex;
	flex-direction: column;
	padding: var(--page-padding);
	gap: 2rem;
	max-width: var(--page-max-width);
	margin: 0 auto;
}

.dashboard-header {
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1.5rem;
	padding: 1.5rem 1.75rem;
	border-radius: var(--radius-lg);
	background: var(--background-secondary);
	box-shadow: var(--shadow-soft);
}

.dashboard-header h1 {
	font-size: clamp(2.2rem, 5vw, 3.6rem);
	line-height: 1.2;
	margin: 0.2rem 0 0.6rem;
	font-family: 'Bahnschrift', 'Inter', sans-serif;
	color: var(--title-color);
}

.eyebrow {
	margin: 0;
	font-size: 0.75rem;
	letter-spacing: 0.28rem;
	text-transform: uppercase;
	color: var(--text-secondary);
}

.sub {
	margin: 0 0 1rem;
	color: var(--text-secondary);
}

.redirect {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	background: transparent;
	border: 1px solid var(--split);
	color: var(--text);
	border-radius: 999px;
	padding: 0.4rem 0.9rem;
}

.redirect:hover {
	box-shadow: var(--shadow-soft);
	transform: translateX(-2px);
}

.arrow {
	font-size: 1.2rem;
}

.panel-group {
	display: grid;
	gap: 1.5rem;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.panel {
	background: var(--card-background);
	border-radius: var(--radius-lg);
	padding: 1.5rem 1.6rem;
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
	border: 1px solid var(--split);
	box-shadow: var(--shadow-soft);

	h2 {
		font-size: 1.1rem;
		opacity: 0.9;
		margin: 0;
	}

	.display {
		font-size: clamp(2rem, 7vw, 2.6rem);
		font-family: Bahnschrift, 'Arial Narrow', sans-serif;
		font-weight: 300;
		letter-spacing: -0.05em;
		margin: 0.2rem 0 0;
	}
}

.players {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.section-head h2 {
	margin: 0;
	font-size: 1.4rem;
	color: var(--title-color);
	font-family: 'Bahnschrift', 'Inter', sans-serif;
}

.count {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 44px;
	padding: 0.2rem 0.7rem;
	border-radius: 999px;
	background: var(--primary-light);
	color: var(--button-primary-text);
	font-weight: 600;
}

.player-cards {
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	padding: 1rem 0;
	width: 100%;
	box-sizing: border-box;
}

.player-cards > * {
	flex: 1 1 200px;
}

.empty {
	margin: 0;
	padding: 1rem 1.2rem;
	border-radius: var(--radius-md);
	background: var(--background-secondary);
	color: var(--text-secondary);
	border: 1px dashed var(--split);
}

button, .redirect {
	cursor: pointer;
}

.select {
	background: var(--background-secondary);
	display: flex;
	flex-direction: column;
	padding: 0.4rem;
	border-radius: 1.2rem;
	border: 1px solid var(--split);
	gap: 0.6rem;
	min-width: 200px;
	align-self: center;
}

.select button {
	border-radius: 0.9rem;
	border: none;
	background: var(--button-secondary-bg);
	color: var(--text);
	padding: 0.8rem 1.4rem;
	font-size: 1rem;
	font-weight: 600;
	text-wrap: nowrap;
}

.select button:hover {
	background: var(--button-secondary-hover);
	box-shadow: var(--shadow-soft);
}

button.active {
	background: var(--primary) !important;
	color: var(--button-primary-text);
	box-shadow: rgba(15, 23, 42, 0.2) 0px 4px 6px -1px, rgba(15, 23, 42, 0.12) 0px 2px 4px -1px !important;
}

@media (max-width: 720px) {
	.dashboard-header {
		padding: 1.2rem;
	}

	.select {
		width: 100%;
		flex-direction: row;
		justify-content: space-between;
	}

	.select button {
		flex: 1;
	}
}
</style>
