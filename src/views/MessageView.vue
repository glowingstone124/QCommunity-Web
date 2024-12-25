<script setup>
import { onBeforeUnmount, onMounted, ref, nextTick } from "vue";
import Redirect from "../components/RedirectButton.vue";
const messageList = ref([]);
let pollingInterval = null;
const usernameCache = new Map();

async function getUsername(sender) {
	if (usernameCache.has(sender)) {
		return usernameCache.get(sender);
	}

	try {
		const response = await fetch(`https://api.qoriginal.vip/qo/download/name?qq=${sender}`);
		const data = await response.json();
		let username = data.username || "未注册";
		if (data.code === 1) {
			username = "未注册"
		} else {
			username = data.username;
		}
		usernameCache.set(sender, username);
		return username;
	} catch (error) {
		console.error("Error fetching username:", error);
		return "未注册";
	}
}

async function getMsgList() {
	try {
		const response = await fetch("https://api.glowingstone.cn/qo/msglist/download");
		const data = await response.json();

		messageList.value = await Promise.all(data.messages.map(async (messageStr) => {
			const message = JSON.parse(messageStr);
			let msgContent = message.message;

			msgContent = msgContent.replace(/\n/g, "<br>");

			const imageRegex = /\[CQ:image,file=.*?\]/g;
			const replRegex = /\[CQ:reply.*?\]/g;
			const videoRegex = /\[CQ:video.*?\]/g;
			const atRegex = /\[CQ:at.*?\]/g;
			const mdRegex = /\[CQ:markdown.*?\]/g;

			let formattedMessage = msgContent
				.replace(imageRegex, "[图片]")
				.replace(replRegex, "[回复]")
				.replace(videoRegex, "[视频]")
				.replace(atRegex, "[@]")
				.replace(mdRegex, "[MD消息]");

			let senderName = message.sender;
			let senderTooltip = senderName;

			if (message.from === 0) {
				senderName = await getUsername(message.sender);
				senderTooltip = message.sender;
			}

			return {
				sender: senderName,
				senderTooltip,
				content: formattedMessage,
				time: new Date(message.time).toLocaleString(),
			};
		}));

		const container = document.querySelector(".message-container");
		if (container) {
			const atBottom = container.scrollHeight - container.scrollTop === container.clientHeight;
			await nextTick();
			if (atBottom) {
				container.scrollTop = container.scrollHeight;
			}
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
		<Redirect to="/message" text-color="white" />
    </span>
		<span class="message-container">
      <div class="msgdiv" v-for="(message, index) in messageList" :key="index">
        <p><strong :title="message.senderTooltip">{{ message.sender }}</strong> <em>{{ message.time }}</em></p>
        <p v-html="message.content"></p>
      </div>
    </span>
	</div>
</template>



<style scoped>
@import "/src/assets/base.css";

.main {
	max-width: 100vw;
	max-height: 100vh;
	display: flex;
	flex-direction: row;
	padding: 5rem 1rem;
	overflow: auto;
}

h1 {
	color: var(--text);
	font-size: 3rem;
	margin: 0;
	font-weight: 100;
}

.back {
	display: inline-block;
	text-decoration: none;
	color: var(--text);
	border-radius: 50px;
	padding: 20px;
	background-color: #437763;
	transition: background-color 0.3s;
	font-size: 1.5rem;
	h2 {
		font-weight: 100;
		margin: 0;
		font-size: 1.5rem;
	}
}

.back:hover {
	background-color: #666b6a;
}

.message-container {
	margin-left: 2vw;
	width: 70%;
	max-width: 80%;
	max-height: 90vh;
	overflow-y: auto;
	padding: 1rem;
}

.msgdiv {
	max-width: 100%;
	border-radius: 10px;
	background-color: rgba(90, 171, 189, 0.5);
	padding: 6px 4px 10px 30px;
	margin-bottom: 1rem;
	color: rgb(144, 210, 243);
	word-wrap: break-word;
}


@media screen and (max-width: 768px) {
	.main {
		flex-direction: column;
		height: 100vh;
	}

	h1 {
		font-size: 3rem;
	}

	.back {
		font-size: 0.6rem;
		border-radius: 30px;
		padding: 0.3rem 1rem;
		margin-bottom: 1rem;
		h2 {
			font-weight: 100;
		}
	}

	.message-container {
		margin-left: 0;
		width: 100%;
		padding: 0;
		height: 80vh;
	}
}
</style>


