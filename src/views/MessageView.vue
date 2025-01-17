<script setup>
import {onBeforeUnmount, onMounted, ref, nextTick} from "vue";
import Redirect from "../components/RedirectButton.vue";

const messageList = ref([]);
const messageInput = ref("");
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

async function sendMessage() {
	if (messageInput.value === "") {
		return;
	}
	try {
		const response = await fetch("https://api.qoriginal.vip/qo/authorization/message/upload", {
			headers: {
				"Content-Type": "application/json",
				"token": localStorage.getItem("token"),
			},
			method: "POST",
			body: JSON.stringify({
				message: messageInput.value,
				timestamp: Date.now(),
			}),
		});

		const data = await response.json();
		console.log(data);

	} catch (error) {
		console.error("Error sending message:", error);
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
    <span class="navigator">
      <h1>消息列表</h1>
		<Redirect to="/message" text-color="white"/>
    </span>
		<span style="display: flex; flex-direction: column;">
		<span class="message-container">
      	<div class="msgdiv" v-for="(message, index) in messageList" :key="index">
        	<p><strong :title="message.senderTooltip">{{ message.sender }}</strong> <em>{{ message.time }}</em></p>
        	<p v-html="message.content"></p>
        </div>
    	</span>
		<div class="input-container">
			<input v-model="messageInput" class="message-input" placeholder="请输入消息..."/>
			<button @click="sendMessage" class="send-button">发送</button>
		</div>
		</span>
	</div>
</template>


<style scoped>
@import "/src/assets/base.css";

.navigator {
	margin-left: 8vw;
}
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


.message-container {
	margin: 10px;
	width: 80%;
	max-width: 100%;
	max-height: 70vh;
	overflow-y: auto;
	padding: 1rem;
}

.msgdiv {
	max-width: 100%;
	border-radius: 10px;
	background-color: rgb(40, 174, 95);
	padding: 6px 4px 10px 30px;
	margin-bottom: 1rem;
	color: rgb(250, 250, 250);
	word-wrap: break-word;
}
p {
	font-size: 1.3rem;
}
.input-container {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	width: 50%;
	margin-top: 10px;
}

.message-input {
	flex-grow: 1;
	padding: 0.5rem;
	font-size: 1rem;
	border: 1px solid #ccc;
	border-radius: 5px;
}

.send-button {
	padding: 1rem 1.5rem;
	background-color: #437763;
	color: white;
	border: none;
	margin-bottom: 15px;
	border-radius: 5px;
	cursor: pointer;
}

@media screen and (max-width: 768px) {
	.input-container {
		flex-direction: column;
		width: 100%;
		margin-top: 10px;
	}

	.message-input {
		width: 80%;
		margin-bottom: 10px;
	}

	.main {
		flex-direction: column;
		height: 100vh;
		padding: 0rem 0rem;
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
	.navigator {
		padding: 10px 30px;
		background-color: #437763;
		margin-bottom: 10px;
		margin-left: 0;
	}

	.message-container {
		margin: auto;
		width: 90%;
		padding: 0;

		height: 80vh;
	}
}
</style>


