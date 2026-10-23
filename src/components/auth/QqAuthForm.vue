<template>
	<form class="qq-auth" @submit.prevent="start">
		<label>
			{{ t('casAuth.qqLabel') }}
			<input v-model="qq" inputmode="numeric" autocomplete="off" pattern="[0-9]{5,12}" required :disabled="busy || !!challenge" />
		</label>
		<div v-if="challenge" class="qq-challenge" aria-live="polite">
			<p>{{ t('casAuth.qqInstruction') }}</p>
			<code>.auth {{ challenge.code }}</code>
			<p>{{ t('casAuth.qqWaiting') }}</p>
		</div>
		<p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>
		<button v-if="authorizedToken" type="button" :disabled="busy" @click="finish">{{ t('loginPage.cas_link') }}</button>
		<button v-else-if="!challenge" type="submit" :disabled="busy">{{ t('casAuth.qqStart') }}</button>
		<button v-else type="button" :disabled="busy" @click="reset">{{ t('casAuth.qqRestart') }}</button>
	</form>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({ onAuthorized: { type: Function, required: true } })
const { t } = useI18n()
const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://api.qoriginal.vip'
const qq = ref('')
const challenge = ref(null)
const authorizedToken = ref('')
const errorMessage = ref('')
const busy = ref(false)
let timer
let generation = 0
let expiresAt = 0
let controller = new AbortController()

function reset() {
	generation++
	clearTimeout(timer)
	controller.abort()
	controller = new AbortController()
	challenge.value = null
	authorizedToken.value = ''
	errorMessage.value = ''
}

async function finish() {
	busy.value = true
	try { await props.onAuthorized(authorizedToken.value) }
	catch { errorMessage.value = t('casAuth.qqGrantFailed') }
	finally { busy.value = false }
}

async function poll(run) {
	if (run !== generation) return
	if (Date.now() >= expiresAt) {
		challenge.value = null
		errorMessage.value = t('casAuth.qqExpired')
		return
	}
	try {
		const response = await fetch(`${apiBase}/qo/game/qq-login/${encodeURIComponent(challenge.value.request_id)}`, { signal: controller.signal })
		if (run !== generation) return
		if (response.status === 404 || response.status === 410) {
			challenge.value = null
			errorMessage.value = t('casAuth.qqExpired')
			return
		}
		if (!response.ok) throw new Error()
		const data = await response.json()
		if (run !== generation) return
		if (data.status === 'authorized' && typeof data.token === 'string' && data.token.trim()) {
			authorizedToken.value = data.token
			await finish()
			return
		}
		errorMessage.value = ''
	} catch (error) {
		if (run !== generation || error.name === 'AbortError') return
		errorMessage.value = t('loginPage.err_network')
	}
	timer = setTimeout(() => poll(run), 3000)
}

async function start() {
	if (busy.value || !/^\d{5,12}$/.test(qq.value.trim())) return
	reset()
	const run = generation
	busy.value = true
	try {
		const response = await fetch(`${apiBase}/qo/game/qq-login`, {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ qq: qq.value.trim() }), signal: controller.signal,
		})
		const data = await response.json()
		if (run !== generation) return
		if (!response.ok || !data.request_id || !/^[A-Z0-9]{8}$/.test(data.code) || !(data.expires_in > 0)) throw new Error()
		challenge.value = data
		expiresAt = Date.now() + Math.min(data.expires_in, 900) * 1000
		timer = setTimeout(() => poll(run), 1000)
	} catch (error) {
		if (error.name !== 'AbortError') errorMessage.value = t('loginPage.err_network')
	} finally { busy.value = false }
}

onBeforeUnmount(reset)
</script>

<style scoped>
.qq-auth { display: grid; gap: 1rem; }
label { display: grid; gap: .5rem; color: var(--text-main); }
input { width: 100%; box-sizing: border-box; padding: .9rem; border: 1px solid var(--split); background: var(--background-secondary); color: var(--text-main); font: inherit; }
button { padding: .9rem; background: var(--primary); color: var(--background); border: 0; cursor: pointer; font: inherit; }
button:disabled { opacity: .6; cursor: wait; }
.qq-challenge { padding: 1rem; background: var(--background-secondary); }
code { font-size: 1.1rem; overflow-wrap: anywhere; user-select: text; }
.error-message { color: #ef4444; }
</style>
