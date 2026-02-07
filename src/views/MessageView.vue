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
		const response = await fetch(`/api/qo/download/name?qq=${sender}`);
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
		const response = await fetch("/api/qo/authorization/message/upload", {
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
	fetch("/api/qo/authorization/account", {
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
	<div class="chat">
		<header class="chat-header">
			<div>
				<p class="eyebrow">Community</p>
				<h1 class="title">聊天记录</h1>
				<p class="subtitle">公共频道消息按时间同步展示</p>
			</div>
			<span class="status-pill">{{ loginstat ? '已连接' : '未登录' }}</span>
		</header>

		<div class="chat-body">
			<div class="message-container" v-if="loginstat">
				<div
					v-for="(message, index) in messageList"
					:key="index"
					class="message-bubble"
				>
					<div class="message-header">
						<span class="sender-name" :title="message.senderTooltip">{{ message.sender }}</span>
						<span class="message-time">{{ message.time }}</span>
					</div>
					<div
						class="message-content"
						v-html="message.content"
					></div>
				</div>
			</div>
			<div class="message-container empty" v-else>
				<h1 class="notification">您必须先登录或者注册才能聊天。</h1>
			</div>
		</div>

		<div class="composer">
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
</template>


<style scoped>
:global(:root) {
	--chat-bg:
		radial-gradient(circle at 10% 0%, rgba(37, 99, 235, 0.14), transparent 55%),
		radial-gradient(circle at 85% 15%, rgba(255, 186, 106, 0.2), transparent 45%),
		linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
	--chat-card: rgba(255, 255, 255, 0.9);
	--chat-soft: rgba(15, 23, 42, 0.05);
	--chat-border: rgba(15, 23, 42, 0.12);
}

:global(:root[data-theme="dark"]) {
	--chat-bg:
		radial-gradient(circle at 10% 0%, rgba(59, 130, 246, 0.16), transparent 55%),
		radial-gradient(circle at 85% 15%, rgba(244, 114, 182, 0.18), transparent 45%),
		linear-gradient(180deg, rgba(11, 18, 32, 0.98), rgba(15, 23, 42, 0.98));
	--chat-card: rgba(17, 24, 39, 0.88);
	--chat-soft: rgba(148, 163, 184, 0.12);
	--chat-border: rgba(148, 163, 184, 0.22);
}

.chat {
	min-height: 94vh;
	height: 94vh;
	padding: 4.5rem 3rem 2rem;
	background: var(--chat-bg);
	display: flex;
	flex-direction: column;
	gap: 1.6rem;
	box-sizing: border-box;
}

.chat-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;
}

.eyebrow {
	text-transform: uppercase;
	letter-spacing: 0.35rem;
	font-size: 0.75rem;
	color: var(--text-secondary);
	margin: 0 0 0.35rem 0;
}

.title {
	margin: 0;
	font-size: 2.4rem;
	color: var(--title-color);
}

.subtitle {
	margin: 0.35rem 0 0 0;
	color: var(--text-secondary);
}

.status-pill {
	padding: 0.35rem 0.9rem;
	border-radius: 999px;
	background: var(--chat-soft);
	border: 1px solid var(--chat-border);
	color: var(--text-main);
	font-size: 0.9rem;
}

.chat-body {
	flex: 1;
	min-height: 0;
	display: flex;
	border-radius: 20px;
	border: 1px solid var(--chat-border);
	background: var(--chat-card);
	box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
	overflow: hidden;
}

.message-container {
	flex: 1;
	min-height: 0;
	padding: 1.8rem;
	overflow: auto;
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.message-container.empty {
	align-items: center;
	justify-content: center;
}

.notification {
	color: var(--text-main);
	font-size: 1.4rem;
	margin: 0;
	text-align: center;
}

.message-bubble {
	background: var(--chat-soft);
	border-radius: 16px;
	padding: 1rem 1.2rem;
	border: 1px solid var(--chat-border);
}

.message-header {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	margin-bottom: 0.45rem;
	gap: 1rem;
}

.sender-name {
	font-weight: 600;
	color: var(--primary);
	font-size: 1.05rem;
	max-width: 200px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.message-time {
	color: var(--text-secondary);
	font-size: 0.8rem;
}

.message-content {
	color: var(--text-main);
	line-height: 1.5;
	font-size: 1.05rem;
}

.composer {
	position: sticky;
	bottom: 0;
}

.input-container {
	display: flex;
	gap: 0.75rem;
	padding: 0.9rem 1rem;
	background: var(--chat-card);
	border: 1px solid var(--chat-border);
	border-radius: 16px;
	box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
}

.message-input {
	flex: 1;
	padding: 0.85rem 1rem;
	border: 1px solid var(--chat-border);
	border-radius: 12px;
	font-size: 1rem;
	background: transparent;
	color: var(--text-main);
	transition: border-color 0.3s, box-shadow 0.3s;
}

.message-input:focus {
	border-color: rgba(37, 99, 235, 0.6);
	outline: none;
	box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.send-button {
	padding: 0.85rem 1.5rem;
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
	border: none;
	border-radius: 12px;
	cursor: pointer;
	transition: all 0.3s;
	font-weight: 600;
}

.send-button:hover:not(:disabled) {
	background: var(--button-primary-hover);
}

.send-button:disabled {
	background: var(--split);
	cursor: not-allowed;
}

@media (max-width: 960px) {
	.chat {
		padding: 4rem 1.5rem 1.5rem;
	}
}

@media (max-width: 640px) {
	.chat {
		padding: 3.5rem 1rem 1rem;
	}

	.chat-header {
		flex-direction: column;
		align-items: flex-start;
	}

	.input-container {
		flex-direction: column;
	}

	.send-button {
		width: 100%;
	}
}
</style>
