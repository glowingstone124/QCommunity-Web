<script setup>
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { alert, defaultModules } from '@pnotify/core'
import '@pnotify/core/dist/PNotify.css'
import '@pnotify/core/dist/BrightTheme.css'
import * as PNotifyMobile from '@pnotify/mobile'
import '@pnotify/mobile/dist/PNotifyMobile.css'
import AccountOverviewPanel from '@/components/account/AccountOverviewPanel.vue'
import AccountPreferencesPanel from '@/components/account/AccountPreferencesPanel.vue'
import AccountSidebar from '@/components/account/AccountSidebar.vue'
import AccountWhitelistPanel from '@/components/account/AccountWhitelistPanel.vue'
import AffiliatedAccountComponent from '@/components/AffiliatedAccountComponent.vue'
import PlayerCardsListComponent from '@/components/PlayerCardsListComponent.vue'
import { accountTabs } from '@/data/accountCenter'
import { getFallenTeamSelection } from '@/services/fallen.js'

defaultModules.set(PNotifyMobile, {})

const router = useRouter()
const { t } = useI18n()
const currentSetting = ref(0)
const username = ref('')
const uid = ref(0)
const playtime = ref(0)
const statistics = ref({})
const logins = ref([])
const iplist = ref([])
const ipAddr = ref('')
const isValidIp = ref(false)
const isSubmittingIp = ref(false)
const isLoadingIps = ref(false)
const deletingIp = ref('')
const ipFeedback = ref('')
const ipFeedbackType = ref('')
const isImmersive = ref(true)
const isFrozen = ref(null)
const statusHint = ref('')
const fallenSelection = ref(null)

function selectTab(tabId) {
	currentSetting.value = tabId
}

function queryAccountData() {
	fetch('https://api.qoriginal.vip/qo/authorization/account', {
		headers: {
			token: localStorage.getItem('token'),
		},
	})
		.then((res) => res.json())
		.then((data) => {
			username.value = data.username
			uid.value = data.uid
			playtime.value = data.playtime
			statistics.value = data.statistics || {}
			logins.value = data.logins
			queryAccountStatus()
		})
	queryFallenTeam()
}

async function queryFallenTeam() {
	try {
		const data = await getFallenTeamSelection()
		fallenSelection.value = data.selected ? data : null
	} catch (error) {
		console.error('加载阵营信息失败:', error)
		fallenSelection.value = null
	}
}

function queryAccountStatus() {
	if (!username.value) {
		return
	}
	isFrozen.value = null
	statusHint.value = t('accountPage.statusChecking')
	fetch(`https://api.glowingstone.cn/qo/download/registry?name=${encodeURIComponent(username.value)}`)
		.then((res) => res.json())
		.then((data) => {
			if (data.code === 1) {
				isFrozen.value = null
				statusHint.value = t('accountPage.statusNotFound')
				return
			}
			isFrozen.value = data.frozen === true
			statusHint.value = isFrozen.value ? t('accountPage.statusFrozen') : t('accountPage.statusNormal')
		})
		.catch(() => {
			isFrozen.value = null
			statusHint.value = t('accountPage.statusFailed')
		})
}

function setIpFeedback(message, type = 'error') {
	ipFeedback.value = message
	ipFeedbackType.value = type
}

async function submitIp() {
	if (!isValidIp.value || isSubmittingIp.value) return
	isSubmittingIp.value = true
	ipFeedback.value = ''
	try {
		const response = await fetch(
			`https://api.qoriginal.vip/qo/authorization/ip/add?ip=${encodeURIComponent(ipAddr.value)}`,
			{ headers: { token: localStorage.getItem('token') || '' } },
		)
		if (!response.ok) throw new Error(`HTTP ${response.status}`)
		const data = await response.json()
		if (data.code === 0) {
			setIpFeedback(t('accountPage.ipAdded'), 'success')
			ipAddr.value = ''
			await queryIpDetails()
		} else if (data.code === 1) {
			alert({ text: t('accountPage.loginExpired') })
			setIpFeedback(t('accountPage.loginExpiredFull'))
		} else if (data.code === 2) {
			setIpFeedback(t('accountPage.ipLimit'))
		} else if (data.code === 4) {
			setIpFeedback(t('accountPage.invalidIp'))
		} else {
			setIpFeedback(data.reason || t('accountPage.addFailed'))
		}
	} catch (error) {
		console.error('添加 IP 失败:', error)
		setIpFeedback(t('accountPage.connectFailed'))
	} finally {
		isSubmittingIp.value = false
	}
}

async function removeIp(ip) {
	if (deletingIp.value) return
	deletingIp.value = ip
	ipFeedback.value = ''
	try {
		const response = await fetch(
			`https://api.qoriginal.vip/qo/authorization/ip/remove?ip=${encodeURIComponent(ip)}`,
			{
				method: 'DELETE',
				headers: { token: localStorage.getItem('token') || '' },
			},
		)
		if (!response.ok) throw new Error(`HTTP ${response.status}`)
		const data = await response.json()
		if (data.code === 0) {
			setIpFeedback(t('accountPage.ipRemoved'), 'success')
			await queryIpDetails()
		} else if (data.code === 1) {
			setIpFeedback(t('accountPage.loginExpiredFull'))
		} else if (data.code === 3) {
			setIpFeedback(t('accountPage.ipNotFound'))
			await queryIpDetails()
		} else {
			setIpFeedback(data.reason || t('accountPage.deleteFailed'))
		}
	} catch (error) {
		console.error('删除 IP 失败:', error)
		setIpFeedback(t('accountPage.connectFailed'))
	} finally {
		deletingIp.value = ''
	}
}

async function queryIpDetails() {
	isLoadingIps.value = true
	try {
		const response = await fetch('https://api.qoriginal.vip/qo/authorization/ip/query', {
			headers: { token: localStorage.getItem('token') || '' },
		})
		if (!response.ok) throw new Error(`HTTP ${response.status}`)
		const data = await response.json()
		iplist.value = Array.isArray(data)
			? data.map((item) => (typeof item === 'string' ? item : item?.ip)).filter(Boolean)
			: []
	} catch (error) {
		console.error('加载 IP 白名单失败:', error)
		setIpFeedback(t('accountPage.whitelistFailed'))
	} finally {
		isLoadingIps.value = false
	}
}

function isValidIpv4(value) {
	const parts = value.split('.')
	return parts.length === 4 && parts.every((part) => {
		if (!/^\d+$/.test(part) || (part.length > 1 && part.startsWith('0'))) return false
		const octet = Number(part)
		return octet >= 0 && octet <= 255
	})
}

function isValidIpv6(value) {
	if (!value.includes(':') || value.includes('%') || !/^[0-9a-fA-F:.]+$/.test(value)) return false
	let candidate = value
	const lastColon = candidate.lastIndexOf(':')
	const ipv4Tail = candidate.slice(lastColon + 1)
	if (ipv4Tail.includes('.')) {
		if (!isValidIpv4(ipv4Tail)) return false
		candidate = `${candidate.slice(0, lastColon)}:0:0`
	}
	if ((candidate.match(/::/g) || []).length > 1) return false
	const hasCompression = candidate.includes('::')
	const groups = candidate.split(':').filter(Boolean)
	if ((!hasCompression && groups.length !== 8) || (hasCompression && groups.length >= 8)) return false
	return groups.every((group) => /^[0-9a-fA-F]{1,4}$/.test(group))
}

function validateIP() {
	const value = ipAddr.value
	isValidIp.value = value === value.trim() && value.length <= 45 && (isValidIpv4(value) || isValidIpv6(value))
}

function logout() {
	localStorage.removeItem('username')
	localStorage.removeItem('token')
	localStorage.removeItem('currentSetting')

	username.value = ''
	uid.value = 0
	playtime.value = 0
	statistics.value = {}
	logins.value = []
	iplist.value = []
	fallenSelection.value = null

	router.push('/login').then(() => window.location.reload())
}

onMounted(() => {
	const storedSetting = Number.parseInt(localStorage.getItem('currentSetting'), 10)
	currentSetting.value = Number.isNaN(storedSetting) ? 0 : storedSetting
	queryAccountData()
})

watch(currentSetting, (newValue) => {
	localStorage.setItem('currentSetting', String(newValue))
	switch (newValue) {
		case 0:
			queryAccountData()
			isImmersive.value = true
			break
		case 1:
			isImmersive.value = true
			queryIpDetails()
			break
		case 2:
		case 3:
		case 4:
			isImmersive.value = false
			break
	}
})

watch(ipAddr, validateIP)
</script>

<template>
	<div class="account page-shell">
		<AccountSidebar
			:current-setting="currentSetting"
			:tabs="accountTabs"
			@select="selectTab"
			@logout="logout"
		/>

		<main class="content" :class="{ immersive: isImmersive, 'personalization-layout': currentSetting === 2 }">
			<transition name="slide-in">
				<AccountOverviewPanel
					v-if="currentSetting === 0"
					key="account-info"
					:username="username"
					:uid="uid"
					:playtime="playtime"
					:statistics="statistics"
					:logins="logins"
					:is-frozen="isFrozen"
					:status-hint="statusHint"
					:fallen-selection="fallenSelection"
				/>
			</transition>

			<transition name="slide-in">
				<AccountWhitelistPanel
					v-if="currentSetting === 1"
					key="ip-whitelist"
					:ip-addr="ipAddr"
					:is-valid-ip="isValidIp"
					:iplist="iplist"
					:is-submitting="isSubmittingIp"
					:is-loading="isLoadingIps"
					:deleting-ip="deletingIp"
					:feedback="ipFeedback"
					:feedback-type="ipFeedbackType"
					@update:ip-addr="ipAddr = $event"
					@submit="submitIp"
					@remove="removeIp"
					@refresh="queryIpDetails"
				/>
			</transition>

			<transition name="slide-in">
				<section v-if="currentSetting === 2" key="personalization" class="panel panel-full">
					<PlayerCardsListComponent />
				</section>
			</transition>

			<transition name="slide-in">
				<section v-if="currentSetting === 3" key="affiliated" class="panel panel-full">
					<AffiliatedAccountComponent />
				</section>
			</transition>

			<transition name="slide-in">
				<AccountPreferencesPanel v-if="currentSetting === 4" key="preferences" />
			</transition>
		</main>
	</div>
</template>

<style scoped>
@import '/src/assets/base.css';
@import '/src/assets/main.css';
@import '/src/assets/colors.css';

:global(:root) {
	--account-bg: var(--page-background);
	--glass-strong: var(--background);
	--glass-soft: var(--background);
	--nav-bg: var(--background);
	--surface-soft: color-mix(in srgb, var(--text-main) 4%, transparent);
	--border-soft: color-mix(in srgb, var(--text-main) 14%, transparent);
	--account-muted-border: color-mix(in srgb, var(--text-main) 9%, transparent);
}

:global(:root[data-theme='dark']) {
	--account-bg: var(--page-background);
	--glass-strong: var(--background-secondary);
	--glass-soft: var(--background-secondary);
	--nav-bg: var(--background-secondary);
	--surface-soft: color-mix(in srgb, var(--dark-text-primary) 7%, transparent);
	--border-soft: color-mix(in srgb, var(--dark-text-primary) 18%, transparent);
	--account-muted-border: color-mix(in srgb, var(--dark-text-primary) 10%, transparent);
}

.account {
	width: 100%;
	max-width: none;
	height: 100%;
	min-height: 0;
	display: grid;
	grid-template-columns: minmax(220px, 296px) minmax(0, 1fr);
	gap: 1rem;
	background: var(--account-bg);
	border-radius: 0;
	padding: 1rem;
	position: relative;
	overflow: hidden;
	animation: account-page-in 300ms ease both;
}

.content {
	min-width: 0;
	min-height: 0;
	position: relative;
	z-index: 1;
	overflow: auto;
	border: 1px solid var(--account-muted-border);
	background: var(--glass-strong);
	border-radius: 0;
}

.content.personalization-layout {
	overflow: hidden;
}

.content.immersive :deep(.panel) {
	background: var(--glass-soft);
}

.panel-full {
	height: 100%;
	padding: 1rem;
	background: var(--glass-strong);
	border: none;
	min-height: 0;
	overflow: hidden;
	max-width: 1400px;
	width: 100%;
	margin: 0 auto;
	box-sizing: border-box;
}

@media (min-width: 1600px) {
	.account {
		grid-template-columns: 296px minmax(0, 1400px);
		justify-content: center;
	}
}

@media (max-width: 960px) {
	.account {
		grid-template-columns: 1fr;
		padding: 0.85rem;
		height: 100%;
		overflow: auto;
	}

	.content {
		border-radius: 0;
	}

	.content.personalization-layout {
		overflow: visible;
	}

	.panel-full {
		height: auto;
		overflow: visible;
		max-width: none;
	}
}

@media (max-width: 640px) {
	.account {
		padding: 0.75rem;
		gap: 0.75rem;
	}

	.content {
		overflow: visible;
	}

	.panel-full {
		padding: 0;
	}
}

.slide-in-enter-active {
	transition:
		opacity 320ms ease,
		transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
}

.slide-in-enter-from {
	opacity: 0;
	transform: translateY(14px);
}

.slide-in-enter-to {
	opacity: 1;
	transform: translateX(0);
}

.slide-in-leave-active {
	display: none;
}

@keyframes account-page-in {
	from { opacity: 0; }
	to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
	.account { animation: none; }
	.slide-in-enter-active { transition: none; }
	.slide-in-enter-from { opacity: 1; transform: none; }
}
</style>
