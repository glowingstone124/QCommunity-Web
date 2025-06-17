<script setup>
import { ref, watch } from 'vue';
import debounce from 'lodash/debounce';
import PlayerInfoCard from "@/components/PlayerCard.vue";
import Redirect from "@/components/RedirectButton.vue";

const message = ref('');
const queryId = ref('');
const avatarUrl = ref("https://crafthead.net/avatar/8667ba71b85a4004af54457a9734eed7");
const qq = ref('');
const online = ref(false);
const banned = ref(false);
const find = ref(false);
const playtime = ref(0);

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
			playtime.value = data.playtime
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
			<Redirect />
		</span>
		<div class="content">
			<h2>在这里查询指定玩家</h2>
			<input v-model="queryId" placeholder="输入查询 ID" class="query-input" />
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
	</div>
</template>

<style scoped>
@import "/src/assets/base.css";
@import "/src/assets/main.css";
.main {
	max-width: 100vw;
	height: auto;
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	padding: 5rem;
	gap: 2rem;
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
	h2 {
		font-weight: 200;
	}
}

.playerCard {
	background-color: rgba(127, 162, 127, 0.5);
	border-radius: 10px;
	padding: 1rem;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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
