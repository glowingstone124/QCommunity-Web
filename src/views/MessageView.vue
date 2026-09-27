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


<style scoped src="./MessageView.css"></style>
