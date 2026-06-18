<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { alert, defaultModules } from '@pnotify/core'
import '@pnotify/core/dist/PNotify.css'
import '@pnotify/core/dist/BrightTheme.css'
import * as PNotifyMobile from '@pnotify/mobile'
import '@pnotify/mobile/dist/PNotifyMobile.css'
import AccountOverviewPanel from '@/components/account/AccountOverviewPanel.vue'
import AccountSidebar from '@/components/account/AccountSidebar.vue'
import AccountWhitelistPanel from '@/components/account/AccountWhitelistPanel.vue'
import AffiliatedAccountComponent from '@/components/AffiliatedAccountComponent.vue'
import PlayerCardsListComponent from '@/components/PlayerCardsListComponent.vue'
import { accountTabs } from '@/data/accountCenter'

defaultModules.set(PNotifyMobile, {})

const router = useRouter()
const currentSetting = ref(0)
const username = ref('')
const uid = ref(0)
const playtime = ref(0)
const logins = ref([])
const iplist = ref([])
const ipAddr = ref('')
const isValidIp = ref(false)
const isImmersive = ref(true)
const isFrozen = ref(null)
const statusHint = ref('')

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
			logins.value = data.logins
			queryAccountStatus()
		})
}

function queryAccountStatus() {
	if (!username.value) {
		return
	}
	isFrozen.value = null
	statusHint.value = '检测中'
	fetch(`https://api.glowingstone.cn/qo/download/registry?name=${encodeURIComponent(username.value)}`)
		.then((res) => res.json())
		.then((data) => {
			if (data.code === 1) {
				isFrozen.value = null
				statusHint.value = '未查询到账号'
				return
			}
			isFrozen.value = data.frozen === true
			statusHint.value = isFrozen.value ? '冻结' : '正常'
		})
		.catch(() => {
			isFrozen.value = null
			statusHint.value = '查询失败'
		})
}

function submitIp() {
	fetch(`https://api.qoriginal.vip/qo/authorization/ip/add?ip=${ipAddr.value}`, {
		headers: {
			token: localStorage.getItem('token'),
		},
	})
		.then((res) => res.json())
		.then((data) => {
			if (data.code === 1) {
				alert({ text: '登录失效，请重新登陆' })
			}
			if (data.code === 2) {
				alert({ text: '您最多只能注册五个ip' })
			}
			queryIpDetails()
		})
}

function queryIpDetails() {
	fetch('https://api.qoriginal.vip/qo/authorization/ip/query', {
		headers: {
			token: localStorage.getItem('token'),
		},
	})
		.then((res) => res.json())
		.then((data) => {
			iplist.value = data
		})
}

function validateIP() {
	const ipPattern =
		/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
	isValidIp.value = ipPattern.test(ipAddr.value)
}

function logout() {
	localStorage.removeItem('username')
	localStorage.removeItem('token')
	localStorage.removeItem('currentSetting')

	username.value = ''
	uid.value = 0
	playtime.value = 0
	logins.value = []
	iplist.value = []

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
					:logins="logins"
					:is-frozen="isFrozen"
					:status-hint="statusHint"
				/>
			</transition>

			<transition name="slide-in">
				<AccountWhitelistPanel
					v-if="currentSetting === 1"
					key="ip-whitelist"
					:ip-addr="ipAddr"
					:is-valid-ip="isValidIp"
					:iplist="iplist"
					@update:ip-addr="ipAddr = $event"
					@submit="submitIp"
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
		</main>
	</div>
</template>

<style scoped>
@import '/src/assets/base.css';
@import '/src/assets/main.css';
@import '/src/assets/colors.css';

:global(:root) {
	--account-bg: var(--background-secondary);
	--glass-strong: var(--background);
	--glass-soft: var(--background);
	--nav-bg: var(--background);
	--surface-soft: color-mix(in srgb, var(--text-main) 4%, transparent);
	--border-soft: color-mix(in srgb, var(--text-main) 14%, transparent);
	--account-muted-border: color-mix(in srgb, var(--text-main) 9%, transparent);
}

:global(:root[data-theme='dark']) {
	--account-bg: var(--background);
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
		padding: 1rem;
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

.slide-in-enter-active {
	transition:
		opacity 0.22s ease,
		transform 0.22s ease;
}

.slide-in-enter-from {
	opacity: 0;
	transform: translateY(8px);
}

.slide-in-enter-to {
	opacity: 1;
	transform: translateX(0);
}

.slide-in-leave-active {
	display: none;
}
</style>
