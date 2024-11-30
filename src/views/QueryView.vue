<script setup>
import { ref, watch } from 'vue';
import debounce from 'lodash/debounce';
import PlayerInfoCard from "@/components/PlayerCard.vue";

const message = ref('');
const queryId = ref('');
const avatarUrl = ref("https://crafthead.net/avatar/8667ba71b85a4004af54457a9734eed7");
const qq = ref('');
const online = ref(false);
const banned = ref(false);
const find = ref(false);

const getPlayer = debounce(async () => {
	try {
		const response = await fetch(`https://api.glowingstone.cn/qo/download/registry?name=${queryId.value}`);
		const data = await response.json();
		if (data.code === 1) {
			find.value = false;
			message.value = "无此用户";
		} else {
			find.value = true;
			qq.value = data.qq;
			online.value = data.online;
			banned.value = data.frozen;
			getAvatar(queryId.value);
		}
	} catch (error) {
		console.error("Error fetching query:", error);
		message.value = "查询失败!";
	}
}, 1000);

async function getAvatar(name) {
	try {
		const response = await fetch(`https://api.glowingstone.cn/qo/download/avatar?name=${name}`);
		const data = await response.json();
		avatarUrl.value = data.url || '';
	} catch (error) {
		console.error("Error fetching avatar:", error);
	}
}

watch(queryId, (newValue) => {
	if (newValue) getPlayer();
});
</script>

<template>
	<div class="main">
		<span>
			<h1>查询</h1>
			<router-link to="/" class="back">
				<h2>回到主页</h2>
			</router-link>
		</span>
		<span class="content">
			<h2>在这里查询</h2>
			<input v-model="queryId" placeholder="输入查询 ID" class="query-input" />
			<div class="playerCard">
				<PlayerInfoCard
					:username="queryId"
					:banned="banned"
					:online="online"
					:qq="qq"
					:found="find"
					:avatar="avatarUrl"
				/>
			</div>
		</span>
	</div>
</template>

<style scoped>
@import "/src/assets/base.css";
@import "/src/assets/main.css";
.main {
	max-width: 100vw;
	height: 100vh;
	display: flex;
	padding: 9rem;
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
	min-width: 1000px;
	h2 {
		font-weight: 200;
	}
}

.playerCard {
	background-color: #7fa5cc80;
	border-radius: 10px;
	padding: 1rem;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	margin-top: 1rem;
	width: 60%;
}

input {
	background-color: #7fa5cc80;
	border: none;
	outline: none;
	padding: 1.5rem;
	border-radius: 10px;
	color: var(--text);
	font-size: 1.7rem;
	font-family: 'Bahnschrift', 'NotoSans', serif;
	border-bottom: 4px solid #4c8fb7;
}
</style>
