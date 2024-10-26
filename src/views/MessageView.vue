<script setup>
import {onBeforeUnmount, onMounted, ref, nextTick} from "vue";

const messageList = ref([]);
let pollingInterval = null;

async function getMsgList() {
	try {
		const response = await fetch("http://rock.glowingstone.cn/qo/msglist/download");
		const data = await response.json();

		messageList.value = data.messages.map((message) => {
			const imageRegex = /\[CQ:image,file=.*?\]/g;
			const replRegex = /\[CQ:reply.*?\]/g;
			const videoRegex = /\[CQ:video.*?\]/g;
			const atRegex = /\[CQ:at.*?\]/g;
			const mdRegex = /\[CQ:markdown.*?\]/g;
			return message
				.replace(imageRegex, "[图片]")
				.replace(replRegex, "[回复]")
				.replace(videoRegex, "[视频]")
				.replace(atRegex, "[@]")
				.replace(mdRegex, "[MD消息]");
		});

		const container = document.querySelector(".message-container");
		if (container) {
			await nextTick();
			container.scrollTop = container.scrollHeight;
		}
	} catch (error) {
		console.error("Error fetching messages:", error);
	}
}

function startPolling() {
	getMsgList();
	pollingInterval = setInterval(getMsgList, 1000);
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
	<div class="main">
		<span>
			<h1>消息列表</h1>
			<router-link to="/" class="back">
				<h2>回到主页</h2>
			</router-link>
		</span>
		<span class="message-container">
			<div class="msgdiv" v-for="(message, index) in messageList" :key="index">
				<p>{{ message }}</p>
			</div>
		</span>
	</div>
</template>

<style scoped>
@import "/src/assets/base.css";

.main {
	max-width: 100vw;
	height: 100vh;
	display: flex;
	flex-direction: row;
	background-color: #111010;
	padding: 9rem;
	overflow: hidden;
}

h1 {
	color: var(--text);
	font-size: 5.6rem;
	margin: 0;
	font-weight: 300;
}

.back {
	display: inline-block;
	text-decoration: none;
	color: var(--text);
	border-radius: 20px;
	padding: 0 30px;
	background-color: #435e77;
	transition: background-color 0.3s;
}

.back:hover {
	background-color: #6b6666;
}

.message-container {
	margin-left: 7vw;
	min-width: 60vw;
	overflow-y: auto;
	padding: 2rem;
}

.msgdiv {
	max-width: 80vw;
	border-radius: 10px;
	background-color: #332f2f;
	padding: 6px 4px 10px 30px;
	margin-bottom: 1rem;
	color: var(--text);
}
</style>
