<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const MESSAGE_DOWNLOAD_URL = 'https://api.glowingstone.cn/qo/msglist/download'
const POLLING_INTERVAL = 3000
const messageContainer = ref(null)
const messageList = ref([])
const messageInput = ref('')
const loading = ref(true)
const fetchError = ref('')
const loginstat = ref(false)
const sendButtonDisabled = ref(false)
const token = ref(localStorage.getItem('token') || '')
let pollingInterval = null
const usernameCache = new Map()

async function getUsername(sender) {
	if (usernameCache.has(sender)) {
		return usernameCache.get(sender)
	}

	try {
		const response = await fetch(`https://api.qoriginal.vip/qo/download/name?qq=${sender}`)
		const data = await response.json()
		let username = data.username || '未注册'
		if (data.code === 1) {
			username = '未注册'
		} else {
			username = data.username
		}
		usernameCache.set(sender, username)
		return username
	} catch (error) {
		console.error('Error fetching username:', error)
		return '未注册'
	}
}

async function sendMessage() {
	const content = messageInput.value.trim()
	if (!content) {
		return
	}
	sendButtonDisabled.value = true
	try {
		const response = await fetch('https://api.qoriginal.vip/qo/authorization/message/upload', {
			headers: {
				'Content-Type': 'application/json',
				token: localStorage.getItem('token'),
			},
			method: 'POST',
			body: JSON.stringify({
				message: content,
				timestamp: Date.now(),
			}),
		})

		const data = await response.json()
		if (data.code === 1) {
			alert('请重新登录，登录已经过期。')
			return
		}
		messageInput.value = ''
		await getMsgList()

	} catch (error) {
		console.error('Error sending message:', error)
		alert(error.message)
	} finally {
		sendButtonDisabled.value = false
	}
}

function getMessageType(from) {
	switch (Number(from)) {
		case 1:
			return 'game'
		case 2:
			return 'system'
		default:
			return 'community'
	}
}

function parseRawMessage(rawMessage) {
	if (typeof rawMessage !== 'string') {
		return rawMessage
	}

	try {
		return JSON.parse(rawMessage)
	} catch (error) {
		return {
			message: rawMessage,
			from: 2,
			sender: 'System',
			time: Date.now(),
		}
	}
}

function normalizePayload(payload) {
	if (Array.isArray(payload)) {
		return payload
	}

	if (Array.isArray(payload?.messages)) {
		return payload.messages
	}

	return []
}

function formatMessageContent(content) {
	return String(content ?? '')
		.replace(/\[CQ:image,file=.*?\]/g, '[图片]')
		.replace(/\[CQ:reply.*?\]/g, '[回复]')
		.replace(/\[CQ:video.*?\]/g, '[视频]')
		.replace(/\[CQ:at.*?\]/g, '[@]')
		.replace(/\[CQ:markdown.*?\]/g, '[MD消息]')
}

async function normalizeMessage(rawMessage) {
	const message = parseRawMessage(rawMessage) || {}
	const messageType = getMessageType(message.from)
	let senderName = String(message.sender || 'Unknown')
	let senderTooltip = senderName

	if (Number(message.from) === 0) {
		senderName = await getUsername(message.sender)
		senderTooltip = String(message.sender || '')
	}

	return {
		content: formatMessageContent(message.message),
		sender: senderName,
		senderTooltip,
		source: messageType,
		sourceLabel: messageType === 'game' ? '游戏' : messageType === 'system' ? '系统' : '群聊',
		time: new Date(Number(message.time) || Date.now()).toLocaleString(),
	}
}

async function getMsgList() {
	const container = messageContainer.value
	const atBottom = container
		? container.scrollHeight - container.scrollTop - container.clientHeight < 24
		: true

	try {
		const response = await fetch(MESSAGE_DOWNLOAD_URL)
		const data = await response.json()
		const rawMessages = normalizePayload(data)

		messageList.value = await Promise.all(rawMessages.map(normalizeMessage))
		fetchError.value = ''
		loading.value = false

		await nextTick()
		if (atBottom && messageContainer.value) {
			messageContainer.value.scrollTop = messageContainer.value.scrollHeight
		}
	} catch (error) {
		console.error('Error fetching messages:', error)
		fetchError.value = '聊天记录加载失败，请稍后重试。'
		loading.value = false
	}
}

function startPolling() {
	getMsgList()
	pollingInterval = setInterval(getMsgList, POLLING_INTERVAL)
}

function stopPolling() {
	clearInterval(pollingInterval)
}

onMounted(() => {
	fetch('https://api.qoriginal.vip/qo/authorization/account', {
			headers: {
				token: token.value,
			}
		}).then(res => res.json())
			.then(data => {
				if (data.error === 3 || data.error === 1) {
					loginstat.value = false
				} else {
					loginstat.value = true
				}
	})
	startPolling()
})

onBeforeUnmount(() => {
	stopPolling()
})
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
			<div
				v-if="loginstat"
				ref="messageContainer"
				class="message-container"
			>
				<div v-if="loading" class="state-panel">正在加载聊天记录...</div>
				<div v-else-if="fetchError" class="state-panel error">{{ fetchError }}</div>
				<div v-else-if="!messageList.length" class="state-panel">暂无聊天记录。</div>
				<div
					v-for="(message, index) in messageList"
					:key="index"
					class="message-bubble"
					:class="`source-${message.source}`"
				>
					<div class="message-header">
						<div class="sender-block">
							<span class="sender-name" :title="message.senderTooltip">{{ message.sender }}</span>
							<span class="source-label">{{ message.sourceLabel }}</span>
						</div>
						<time class="message-time">{{ message.time }}</time>
					</div>
					<p class="message-content">{{ message.content }}</p>
				</div>
			</div>
			<div class="message-container empty" v-else>
				<p class="notification">您必须先登录或者注册才能聊天。</p>
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
	--chat-bg: var(--background-secondary);
	--chat-card: var(--background);
	--chat-soft: color-mix(in srgb, var(--text-main) 4%, transparent);
	--chat-border: color-mix(in srgb, var(--text-main) 14%, transparent);
}

:global(:root[data-theme="dark"]) {
	--chat-bg: var(--background);
	--chat-card: var(--background-secondary);
	--chat-soft: color-mix(in srgb, var(--dark-text-primary) 7%, transparent);
	--chat-border: color-mix(in srgb, var(--dark-text-primary) 18%, transparent);
}

.chat {
	min-height: 100%;
	height: 100%;
	padding: 1rem;
	background: var(--chat-bg);
	display: flex;
	flex-direction: column;
	gap: 1rem;
	box-sizing: border-box;
	max-width: 1400px;
	margin: 0 auto;
	width: 100%;
	overflow: hidden;
}

.chat-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;
}

.eyebrow {
	text-transform: uppercase;
	letter-spacing: 0;
	font-size: 0.75rem;
	color: var(--text-secondary);
	margin: 0 0 0.35rem 0;
	font-weight: 700;
}

.title {
	margin: 0;
	font-size: 1.45rem;
	line-height: 1.2;
	color: var(--title-color);
}

.subtitle {
	margin: 0.35rem 0 0 0;
	color: var(--text-secondary);
}

.status-pill {
	padding: 0.35rem 0.65rem;
	border-radius: 6px;
	background: var(--chat-soft);
	border: 1px solid var(--chat-border);
	color: var(--text-main);
	font-size: 0.9rem;
}

.chat-body {
	flex: 1;
	min-height: 0;
	display: flex;
	border-radius: 8px;
	border: 1px solid var(--chat-border);
	background: var(--chat-card);
	box-shadow: none;
	overflow: hidden;
}

.message-container {
	flex: 1;
	min-height: 0;
	padding: 1rem;
	overflow: auto;
	display: flex;
	flex-direction: column;
	gap: 0.65rem;
}

.message-container.empty {
	align-items: center;
	justify-content: center;
}

.notification {
	color: var(--text-main);
	font-size: 1rem;
	margin: 0;
	text-align: center;
}

.state-panel {
	border: 1px solid var(--chat-border);
	background: var(--chat-soft);
	border-radius: 6px;
	padding: 0.9rem 1rem;
	color: var(--text-secondary);
}

.state-panel.error {
	color: var(--error);
	border-color: color-mix(in srgb, var(--error) 40%, transparent);
}

.message-bubble {
	background: var(--chat-soft);
	border-radius: 6px;
	padding: 0.82rem 0.9rem;
	border: 1px solid var(--chat-border);
	border-left-width: 3px;
	max-width: min(920px, 100%);
	box-sizing: border-box;
}

.message-bubble.source-game {
	border-left-color: var(--primary);
}

.message-bubble.source-system {
	border-left-color: var(--warning);
}

.message-bubble.source-community {
	border-left-color: var(--success);
}

.message-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 0.45rem;
	gap: 1rem;
}

.sender-block {
	display: flex;
	align-items: center;
	gap: 0.45rem;
	min-width: 0;
}

.sender-name {
	font-weight: 600;
	color: var(--primary);
	font-size: 0.96rem;
	max-width: 200px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.source-label {
	border: 1px solid var(--chat-border);
	border-radius: 4px;
	color: var(--text-secondary);
	font-size: 0.72rem;
	padding: 0.08rem 0.35rem;
	white-space: nowrap;
}

.message-time {
	color: var(--text-secondary);
	font-size: 0.8rem;
	white-space: nowrap;
}

.message-content {
	color: var(--text-main);
	line-height: 1.55;
	font-size: 0.98rem;
	margin: 0;
	white-space: pre-wrap;
	overflow-wrap: anywhere;
	word-break: break-word;
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
	border-radius: 8px;
	box-shadow: none;
}

.message-input {
	flex: 1;
	padding: 0.85rem 1rem;
	border: 1px solid var(--chat-border);
	border-radius: 6px;
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
	border: 1px solid var(--primary);
	border-radius: 6px;
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
		padding: 1rem;
	}
}

@media (max-width: 640px) {
	.chat {
		padding: 0.75rem;
	}

	.chat-header {
		flex-direction: column;
		align-items: flex-start;
	}

	.input-container {
		flex-direction: column;
	}

	.message-header {
		flex-direction: column;
		gap: 0.35rem;
	}

	.send-button {
		width: 100%;
	}
}
</style>
