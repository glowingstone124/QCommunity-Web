<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const MESSAGE_DOWNLOAD_URL = 'https://api.glowingstone.cn/qo/msglist/public'
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
		let username = data.username || t('messagesPage.notRegistered')
		if (data.code === 1) {
			username = t('messagesPage.notRegistered')
		} else {
			username = data.username
		}
		usernameCache.set(sender, username)
		return username
	} catch (error) {
		console.error('Error fetching username:', error)
		return t('messagesPage.notRegistered')
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
			alert(t('messagesPage.relogin'))
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
			.replace(/\[CQ:image,file=.*?\]/g, `[${t('messagesPage.image')}]`)
			.replace(/\[CQ:reply.*?\]/g, `[${t('messagesPage.reply')}]`)
			.replace(/\[CQ:video.*?\]/g, `[${t('messagesPage.video')}]`)
		.replace(/\[CQ:at.*?\]/g, '[@]')
			.replace(/\[CQ:markdown.*?\]/g, `[${t('messagesPage.markdown')}]`)
}

function normalizeImageUrls(images) {
	if (!Array.isArray(images)) {
		return []
	}

	const normalized = []
	for (const value of images) {
		if (typeof value !== 'string' || value.length > 2048) {
			continue
		}
		try {
			const url = new URL(value)
			if ((url.protocol === 'http:' || url.protocol === 'https:') && !normalized.includes(url.href)) {
				normalized.push(url.href)
			}
		} catch {
			// Ignore malformed links supplied by older or third-party chat clients.
		}
		if (normalized.length >= 8) {
			break
		}
	}
	return normalized
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
		content: String(message.message ?? ''),
		images: normalizeImageUrls(message.images),
		sender: senderName,
		senderTooltip,
		source: messageType,
			time: Number(message.time) || Date.now(),
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
		fetchError.value = t('messagesPage.loadFailed')
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

function formatMessageTime(timestamp) {
	return new Date(timestamp).toLocaleString(locale.value === 'zh' ? 'zh-CN' : 'en-US')
}
</script>


<template>
	<div class="chat">
		<header class="chat-header">
			<div>
				<h1 class="title">{{ t('messagesPage.title') }}</h1>
			</div>
			<span class="status-pill">{{ loginstat ? t('messagesPage.connected') : t('messagesPage.loggedOut') }}</span>
		</header>

		<div class="chat-body">
			<div
				v-if="loginstat"
				ref="messageContainer"
				class="message-container"
			>
				<div v-if="loading" class="state-panel">{{ t('messagesPage.loading') }}</div>
				<div v-else-if="fetchError" class="state-panel error">{{ fetchError }}</div>
				<div v-else-if="!messageList.length" class="state-panel">{{ t('messagesPage.empty') }}</div>
				<div
					v-for="(message, index) in messageList"
					:key="index"
					class="message-bubble"
					:class="`source-${message.source}`"
				>
					<div class="message-header">
						<div class="sender-block">
							<span class="sender-name" :title="message.senderTooltip">{{ message.sender }}</span>
								<span class="source-label">{{ t(`messagesPage.${message.source}`) }}</span>
						</div>
						<time class="message-time">{{ formatMessageTime(message.time) }}</time>
					</div>
						<p class="message-content">{{ formatMessageContent(message.content) }}</p>
					<div v-if="message.images.length" class="message-images">
						<a
							v-for="(imageUrl, imageIndex) in message.images"
							:key="imageUrl"
							:href="imageUrl"
							class="message-image-link"
							target="_blank"
							rel="noopener noreferrer"
								:aria-label="t('messagesPage.openImage', { index: imageIndex + 1 })"
						>
							<img
								:src="imageUrl"
									:alt="t('messagesPage.imageAlt', { index: imageIndex + 1 })"
								class="message-image"
								loading="lazy"
								referrerpolicy="no-referrer"
							/>
						</a>
					</div>
				</div>
			</div>
			<div class="message-container empty" v-else>
					<p class="notification">{{ t('messagesPage.loginRequired') }}</p>
			</div>
		</div>

		<div class="composer">
			<div class="input-container">
				<input
					v-model="messageInput"
					class="message-input"
						:placeholder="t('messagesPage.placeholder')"
					@keydown.enter="sendMessage"
				/>
				<button
					@click="sendMessage"
					class="send-button"
					:disabled="sendButtonDisabled"
				>
						{{ sendButtonDisabled ? t('messagesPage.sending') : t('messagesPage.send') }}
				</button>
			</div>
		</div>
	</div>
</template>


<style scoped>
:global(:root) {
	--chat-bg: var(--page-background);
	--chat-card: color-mix(in srgb, var(--background) 96%, var(--primary));
	--chat-soft: color-mix(in srgb, var(--text-main) 4%, transparent);
	--chat-border: color-mix(in srgb, var(--text-main) 13%, transparent);
	--chat-border-strong: color-mix(in srgb, var(--text-main) 24%, transparent);
}

:global(:root[data-theme="dark"]) {
	--chat-bg: var(--page-background);
	--chat-card: color-mix(in srgb, var(--background-secondary) 92%, var(--primary));
	--chat-soft: color-mix(in srgb, var(--dark-text-primary) 7%, transparent);
	--chat-border: color-mix(in srgb, var(--dark-text-primary) 18%, transparent);
	--chat-border-strong: color-mix(in srgb, var(--dark-text-primary) 26%, transparent);
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
	flex: 0 0 auto;
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;
	width: min(1400px, 100%);
	margin: 0 auto;
}

.title {
	margin: 0;
	font-size: 1.45rem;
	line-height: 1.2;
	color: var(--title-color);
}

.status-pill {
	padding: 0.35rem 0.65rem;
	background: var(--chat-soft);
	border: 1px solid var(--chat-border);
	color: var(--text-main);
	font-size: 0.9rem;
}

.chat-body {
	flex: 1 1 auto;
	min-height: 0;
	display: flex;
	border: 1px solid var(--chat-border);
	background: var(--chat-card);
	overflow: hidden;
	width: min(1400px, 100%);
	margin: 0 auto;
}

.message-container {
	flex: 1 1 auto;
	width: 100%;
	min-height: 0;
	padding: 1rem;
	box-sizing: border-box;
	overflow: auto;
	overscroll-behavior: contain;
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
	flex: 0 0 auto;
	border: 1px solid var(--chat-border);
	background: var(--chat-soft);
	padding: 0.9rem 1rem;
	color: var(--text-secondary);
}

.state-panel.error {
	color: var(--error);
	border-color: color-mix(in srgb, var(--error) 40%, transparent);
}

.message-bubble {
	flex: 0 0 auto;
	background: var(--chat-soft);
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

.message-images {
	display: flex;
	flex-wrap: wrap;
	gap: 0.55rem;
	margin-top: 0.65rem;
}

.message-image-link {
	display: block;
	max-width: 100%;
	border: 1px solid var(--chat-border);
	background: var(--chat-card);
	line-height: 0;
}

.message-image-link:focus-visible {
	outline: 2px solid var(--primary);
	outline-offset: 2px;
}

.message-image {
	display: block;
	width: auto;
	height: auto;
	max-width: min(360px, 100%);
	max-height: 280px;
	object-fit: contain;
}

.composer {
	flex: 0 0 auto;
	position: sticky;
	bottom: 0;
	width: min(1400px, 100%);
	margin: 0 auto;
}

.input-container {
	display: flex;
	gap: 0.75rem;
	padding: 0.9rem 1rem;
	background: var(--chat-card);
	border: 1px solid var(--chat-border);
}

.message-input {
	flex: 1;
	padding: 0.85rem 1rem;
	border: 1px solid var(--chat-border);
	font-size: 1rem;
	background: transparent;
	color: var(--text-main);
	transition:
		border-color 160ms ease,
		background-color 160ms ease;
}

.message-input:focus {
	border-color: var(--primary);
	outline: none;
	background: var(--background);
}

.send-button {
	padding: 0.85rem 1.5rem;
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
	border: 1px solid var(--primary);
	cursor: pointer;
	transition:
		background-color 160ms ease,
		border-color 160ms ease;
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
