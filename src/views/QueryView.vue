<script setup>
import {ref} from 'vue';
import debounce from 'lodash/debounce';
import PlayerInfoCard from "@/components/PlayerCard.vue";

const inputId = ref('');
const queryId = ref('');
const avatarUrl = ref("https://crafthead.net/avatar/8667ba71b85a4004af54457a9734eed7");
const qq = ref('');
const online = ref(false);
const banned = ref(false);
const find = ref(false);
const playtime = ref(0);
const affiliated = ref(false);
const host = ref("")

async function getPlayer(id) {
	try {
		const response = await fetch(`https://api.glowingstone.cn/qo/download/registry?name=${id}`);
		const data = await response.json();
		if (data.code === 1) {
			find.value = false;
		} else if (data.affiliated === true) {
			affiliated.value = true;
			host.value = data.host;
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
	<div class="query-page">
		<header class="page-header">
			<div>
				<p class="eyebrow">玩家查询</p>
				<h1>查询指定玩家信息</h1>
				<p class="sub">输入玩家 ID 以查看状态、QQ 与在线信息。</p>
			</div>
		</header>

		<section class="search-panel">
			<div class="search-box">
				<label class="search-label" for="player-id">玩家 ID</label>
				<div class="search-row">
					<input id="player-id" v-model="inputId" placeholder="输入查询 ID" class="query-input"/>
					<button class="search-btn" @click="handleSearch">查询</button>
				</div>
			</div>
			<div class="search-tip">
				<p class="tag">支持大小写字母与数字组合</p>
			</div>
		</section>

		<section class="result-panel">
			<div class="section-head">
				<h2>查询结果</h2>
				<span class="count">{{ queryId ? 1 : 0 }}</span>
			</div>

			<div v-if="queryId && affiliated" class="affiliated">
				<h3>该玩家为关联账号</h3>
				<p>主账号：{{ host }}</p>
			</div>

			<PlayerInfoCard
				v-else-if="queryId"
				:username="queryId"
				:banned="banned"
				:online="online"
				:qq="qq"
				:found="find"
				:avatar="avatarUrl"
				:playtime="playtime"
			/>

			<p v-else class="empty">请输入玩家 ID 并点击查询。</p>
		</section>
	</div>

</template>

<style scoped>
@import "/src/assets/base.css";
@import "/src/assets/main.css";

.query-page {
	min-height: calc(100vh - 60px);
	padding: var(--page-padding);
	max-width: var(--page-max-width);
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	gap: 2rem;
}

.page-header {
	padding: 1.5rem 1.75rem;
	border-radius: var(--radius-lg);
	background: var(--background-secondary);
	box-shadow: var(--shadow-soft);
}

.page-header h1 {
	margin: 0.3rem 0 0.4rem;
	font-size: clamp(2rem, 5vw, 3rem);
	color: var(--title-color);
	font-family: 'Bahnschrift', 'Inter', sans-serif;
}

.eyebrow {
	margin: 0;
	font-size: 0.75rem;
	letter-spacing: 0.28rem;
	text-transform: uppercase;
	color: var(--text-secondary);
}

.sub {
	margin: 0;
	color: var(--text-secondary);
}

.search-panel {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	gap: 1.5rem;
	align-items: center;
}

.search-box {
	display: flex;
	flex-direction: column;
	gap: 0.8rem;
	padding: 1.5rem;
	border-radius: var(--radius-lg);
	background: var(--card-background);
	border: 1px solid var(--split);
	box-shadow: var(--shadow-soft);
}

.search-label {
	font-size: 0.9rem;
	color: var(--text-secondary);
}

.search-row {
	display: flex;
	gap: 1rem;
}

.search-tip {
	display: flex;
	justify-content: flex-end;
}

.tag {
	background-color: var(--primary-light);
	color: var(--button-primary-text);
	width: fit-content;
	padding: 0.4rem 0.8rem;
	border-radius: 999px;
	margin: 0;
	font-size: 0.9rem;
	font-weight: 600;
}

.result-panel {
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

.affiliated {
	display: flex;
	flex-direction: column;
	color: var(--text-main);
	background-color: var(--card-background);
	padding: 1.5rem;
	border-radius: var(--radius-lg);
	border: 1px solid var(--split);
	box-shadow: var(--shadow-soft);
	gap: 0.4rem;
}

.affiliated h3 {
	margin: 0;
	color: var(--title-color);
}

.affiliated p {
	margin: 0;
	color: var(--text-secondary);
}

.empty {
	margin: 0;
	padding: 1rem 1.2rem;
	border-radius: var(--radius-md);
	background: var(--background-secondary);
	color: var(--text-secondary);
	border: 1px dashed var(--split);
}

.search-btn {
	padding: 1rem 2rem;
	border: none;
	border-radius: 8px;
	background-color: var(--button-primary-bg);
	color: var(--button-primary-text);
	font-weight: bold;
	cursor: pointer;
	font-family: 'Bahnschrift', 'NotoSans', serif;
}

.search-btn:hover {
	background-color: var(--button-primary-hover);
}

input {
	border: none;
	outline: none;
	padding: 1rem;
	border-radius: var(--radius-md);
	color: var(--text-main);
	font-size: 1.1rem;
	font-family: 'Bahnschrift', 'NotoSans', serif;
}

.query-input {
	background-color: var(--background-secondary);
	border: 1px solid var(--split);
	width: 100%;
}

.query-input::placeholder {
	color: var(--text-secondary);
}

.query-input:focus {
	border-color: var(--primary);
	box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

@media screen and (max-width: 768px) {
	.search-panel {
		grid-template-columns: 1fr;
	}

	.search-row {
		flex-direction: column;
	}

	.search-btn {
		width: 100%;
	}
}

</style>
