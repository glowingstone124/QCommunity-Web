<script setup>
import {onBeforeUnmount, onMounted, ref, nextTick} from "vue";
import Redirect from "../components/RedirectButton.vue";

const messageList = ref([]);
const messageInput = ref("");
let pollingInterval = null;
const usernameCache = new Map();
const loginstat = ref(false)
const sendButtonDisabled = ref(false);
const token = ref(localStorage.getItem('token') || "");
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
	sendButtonDisabled.value = true;
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
		if (data.code === 1) {
			alert("请重新登录，登录已经过期。")
			return;
		}
		sendButtonDisabled.value = false;
		messageInput.value = "";
		await getMsgList();

	} catch (error) {
		console.error("Error sending message:", error);
		alert(error.message);
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
	fetch("https://api.qoriginal.vip/qo/authorization/account", {
			headers: {
				"token": token.value
			}
		}).then(res => res.json())
			.then(data => {
				if (data.error === 3 || data.error === 1) {
					loginstat.value = false
				} else {
					loginstat.value = true
				}
	});
	startPolling();
})

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
		<div class="content-wrapper">
			<div class="message-container" v-if="loginstat">

				<div
					v-for="(message, index) in messageList"
					:key="index"
					class="message-bubble"
				>
					<div class="message-header">
            <span class="sender-name" :title="message.senderTooltip"
			>{{ message.sender }}</span>
						<span class="message-time">{{ message.time }}</span>
					</div>
					<div
						class="message-content"
						v-html="message.content"
					></div>
				</div>
			</div>
			<div class="message-container" v-else>
				<h1 class="notification">您必须先登录或者注册才能聊天。</h1>
			</div>
			<div class="fixed-input-container">
				<div class="input-container">
					<input
						v-model="messageInput"
						class="message-input"
						placeholder="请输入消息..."
						@keydown.enter="sendMessage"
					/>
					<button
						@click="sendMessage"
						class="send-button"
						:disabled="sendButtonDisabled"
					>
						{{ sendButtonDisabled ? '发送中...' : '发送' }}
					</button>
				</div>
			</div>
		</div>
	</div>
</template>


<style scoped>
.main {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 1rem;
    overflow: hidden;
    background: #3b4444;
    box-sizing: border-box;
}
.notification {
	color:black;

}
.fixed-input-container {
	bottom: 0;
	left: 20px;
	right: 20px;
	z-index: 1000;
	padding: 1rem 0;
}

.navigator {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1rem 2rem;
	background: #437763;
	border-radius: 12px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h1 {
	color: white;
	font-size: 2rem;
	margin: 0;
	font-weight: 500;
}

.content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background:#3b4444;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-container {
	flex: 1;
	padding: 2rem;
	overflow:auto;
	border-radius: 8px;
}

.message-bubble {
	background: #383838;
	border-radius: 12px;
	padding: 1rem;
	margin-bottom: 1rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.5rem;
}

.sender-name {
	font-weight: 600;
	color: #437763;
	font-size: 0.95rem;
	max-width: 200px;
	overflow: hidden;
	text-overflow: ellipsis;
}

.message-time {
	color: #666;
	font-size: 0.85rem;
}

.message-content {
	color: #ede8e8;
	line-height: 1.5;
	font-size: 1rem;
}

.input-container {
	display: flex;
	gap: 0.5rem;
	padding: 1rem;
	background: #3b4444;
	border-radius: 8px;
	box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.message-input {
	flex: 1;
	padding: 0.8rem;
	border: 2px solid #e0e0e0;
	border-radius: 8px;
	font-size: 1rem;
	transition: border-color 0.3s;
}

.message-input:focus {
	border-color: #437763;
	outline: none;
}

.send-button {
	padding: 0.8rem 1.5rem;
	background: #437763;
	color: white;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.3s;
}

.send-button:hover:not(:disabled) {
	background: #365f4d;
}

.send-button:disabled {
	background: #a0a0a0;
	cursor: not-allowed;
}

@media (max-width: 768px) {
	.navigator {
		padding: 0.8rem;
		margin: 0 -1rem;
		border-radius: 0;
	}
	.message-input {
		max-width: 80%;
	}

	.fixed-input-container {
		left: 0;
		right: 0;
		padding: 1rem;
	}

	h1 {
		font-size: 1.5rem;
	}

	.content-wrapper {
		border-radius: 0;
		padding: 0.5rem;
	}

	.message-container {
		padding: 0.5rem;
	}

	.input-container {
		flex-direction: column;
		padding: 2rem;
		background: none;
		backdrop-filter: blur(6px);
	}

	.message-input {
		width: 100%;
	}

	.send-button {
		width: 100%;
		padding: 0.8rem;
	}
}
</style>


