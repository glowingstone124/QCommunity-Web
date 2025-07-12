<script setup>
import {ref} from 'vue';
import debounce from 'lodash/debounce';
import PlayerInfoCard from "@/components/PlayerCard.vue";
import Redirect from "@/components/RedirectButton.vue";
import ArtCardForQueryUsage from "@/components/ArtCardForQueryUsage.vue";

const inputId = ref('');
const queryId = ref('');
const avatarUrl = ref("https://crafthead.net/avatar/8667ba71b85a4004af54457a9734eed7");
const qq = ref('');
const online = ref(false);
const banned = ref(false);
const find = ref(false);
const playtime = ref(0);

async function getPlayer(id) {
	try {
		const response = await fetch(`https://api.glowingstone.cn/qo/download/registry?name=${id}`);
		const data = await response.json();
		if (data.code === 1) {
			find.value = false;
		} else {
			find.value = true;
			qq.value = data.qq;
			online.value = data.online;
			banned.value = data.frozen;
			playtime.value = data.playtime;
			await getAvatar(id);
		}
	} catch (error) {
		console.error("Error fetching query:", error);
	}
}

async function getAvatar(name) {
	try {
		const response = await fetch(`https://api.glowingstone.cn/qo/download/avatar?name=${name}`);
		const data = await response.json();
		avatarUrl.value = data.url || '';
	} catch (error) {
		console.error("Error fetching avatar:", error);
	}
}

const handleSearch = debounce(async () => {
	queryId.value = inputId.value.trim();
	if (queryId.value !== '') {
		await getPlayer(queryId.value);
	}
}, 300);

</script>

<template>
	<div class="content">
		<div class="left">
			<h2>在这里查询指定玩家</h2>
			<div style="display: flex; gap: 1rem;">
				<input v-model="inputId" placeholder="输入查询 ID" class="query-input"/>
				<button class="search-btn" @click="handleSearch">查询</button>
			</div>
			<div class="playerCard">
				<PlayerInfoCard
					:username="queryId"
					:banned="banned"
					:online="online"
					:qq="qq"
					:found="find"
					:avatar="avatarUrl"
					:playtime="playtime"
				/>
			</div>
		</div>
		<div class="right">
			<div class="artcard">
				<ArtCardForQueryUsage :username="queryId" scale="0.6"/>
			</div>
		</div>
	</div>

</template>

<style scoped>
@import "/src/assets/base.css";
@import "/src/assets/main.css";


.content{
	display: flex;
}

.left {
	flex: 4;
}
.right{
	flex: 6;
}

.artcard {
	align-self: center;
	margin-left: 7rem;
	max-height: 900px;
}

.main {
	max-width: 100vw;
	height: auto;
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	padding: 5rem;
	gap: 2rem;
}

.search-btn {
	padding: 1rem 2rem;
	border: none;
	border-radius: 8px;
	background-color: #5da36e;
	color: white;
	font-weight: bold;
	cursor: pointer;
	font-family: 'Bahnschrift', 'NotoSans', serif;
	transition: background-color 0.2s ease;
}

.search-btn:hover {
	background-color: #3c7c4e;
}

h1 {
	color: var(--text);
	font-size: 5.6rem;
	margin-top: 0;
	margin-bottom: 0;
	font-weight: 300;
}

h2 {
	color: var(--text);
}

.back {
	display: inline-block;
	text-decoration: none;
	color: var(--text);
	border-radius: 20px;
	padding: 0 30px;
	background-color: #378eaf;

	h2 {
		font-weight: 100;
	}
}

.back:hover {
	background-color: #6b6666;
}

.content {
	margin-left: 5vw;
	max-width: 1000px;
	margin-top: 3rem;
	h2 {
		font-weight: 200;
	}
}

.playerCard {
	border-radius: 10px;
	padding: 1rem;
	margin-top: 1rem;
	transition: all 0.3s;
	width: 100%;
}

input {
	border: none;
	outline: none;
	padding: 1rem;
	border-radius: 10px;
	color: var(--text);
	font-size: 1.7rem;
	font-family: 'Bahnschrift', 'NotoSans', serif;
}

.query-input {
	background-color: #a5c9a9;
	border-bottom: 0px solid #60b74c;
	width: 95%;
}

.query-input::placeholder {
	color: rgba(37, 72, 28, 0.34);
}

.query-input:focus {
	border-bottom: 4px solid #60b74c;
}

@media screen and (max-width: 768px) {
	.main {
		flex-direction: column;
		align-items: center;
		padding: 2rem;
	}

	.content {
		margin-left: 0;
		min-width: 100%;
	}

	.playerCard {
		width: 95%;

	}

	input {
		width: 100%;
		font-size: 1.4rem;
		padding: 0.1rem;
	}

	h1 {
		font-size: 3rem;
		text-align: center;
	}

	h2 {
		font-size: 1.5rem;
		text-align: center;
	}
}

</style>
