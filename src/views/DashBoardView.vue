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
		<div style="flex: 3; display: flex; flex-direction: column; align-items: center;">
			<h1>仪表板</h1>
			<span class="redirect" @click="redirect">
				<p class="arrow"><</p> <p>回到首页</p>
			</span>
			<div class="select">
				<button @click="currentServerId = 1" :class="currentServerId === 1 ? 'active' : ''">生存服</button>
				<button @click="currentServerId = 4" :class="currentServerId === 4 ? 'active' : ''">创造服</button>
			</div>
		</div>
		<div style="flex: 2">
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
		</div>
		<div style=" flex: 5">
			<h2>{{ onlinecount !== 0 ? "玩家列表" : "暂无玩家" }}</h2>
			<ul>
				<div class="player-cards">
					<PlayerCard v-for="player in players" :key="player.name" :player="player"/>
				</div>
			</ul>
		</div>
	</div>
</template>

<style scoped>
@import "@/assets/base.css";
@import "@/assets/main.css";

.dashboard {
	height: 100vh;
	color: var(--text);
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	padding: 2rem 1.5rem;
	gap: 2rem;
	overflow: scroll;
}

@media (min-width: 1024px) {
	.dashboard {
		flex-direction: row;
		flex-wrap: wrap;
		align-items: start;
		> * {
			flex: 1 1 300px;
		}
	}
}

.dashboard > div:first-child {
	order: -1;
	flex-basis: 100%;
	h1 {
		font-size: clamp(2.5rem, 5vw, 4rem);
		line-height: 1.2;
		margin-bottom: 1.5rem;
	}
}

.redirect {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	transition: opacity 0.3s;
	&:hover {
		opacity: 0.8;
		.arrow {
			transform: translateX(-4px);
		}
	}
	.arrow {
		transition: transform 0.3s;
	}
}

.panel-group {
	display: grid;
	gap: 1.5rem;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.panel {
	background: #8aa855;
	margin: 1.5rem;
	border-radius: 1rem;
	padding: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

	h2 {
		font-size: 1.1rem;
		opacity: 0.9;
	}

	.display {
		font-size: clamp(2rem, 7vw, 2.6rem);
		font-family: Bahnschrift, 'Arial Narrow', sans-serif;
		font-weight: 300;
		letter-spacing: -0.05em;
	}
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



h1, h2 {
	color: var(--text);
	&:focus {
		outline: 2px solid var(--text);
	}
}

button, .redirect {
	cursor: pointer;
	&:focus-visible {
		outline: 2px solid var(--text);
		outline-offset: 2px;
	}
}

.panel, .player-cards {
	will-change: transform;
}
.select {
	background: #8aa855;
	display: flex;
	flex-direction: column;
	padding: 0.3em;
	border-radius: 1.2rem;
	margin: 0.8rem;
	button {
		border-radius: 0.9rem;
		margin: 10px 10px;
		border:none;
		background: #598a2c;
		color: var(--text);
		padding: 1rem 5rem;
		font-size: 1.1rem;
		font-weight: 600;
		text-wrap: nowrap;
	}
	button:hover{
		background: #536b2c;
		box-shadow: rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px;
	}
}
button.active {
	background: #65d730 !important;
	box-shadow: rgb(241, 240, 240) 0px 4px 6px -1px, rgba(255, 253, 253, 0.97) 0px 2px 4px -1px !important;
}
</style>
