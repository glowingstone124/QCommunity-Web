<script setup>
import { onMounted, ref, watch } from 'vue'
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
		<AccountSidebar :current-setting="currentSetting" :tabs="accountTabs" @select="selectTab" />

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
	--account-bg:
		radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 55%),
		radial-gradient(circle at 20% 10%, rgba(255, 186, 106, 0.25), transparent 45%),
		linear-gradient(160deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.95));
	--glass-strong: rgba(255, 255, 255, 0.75);
	--glass-soft: rgba(255, 255, 255, 0.85);
	--nav-bg: rgba(255, 255, 255, 0.7);
	--surface-soft: rgba(15, 23, 42, 0.05);
	--border-soft: rgba(15, 23, 42, 0.08);
	--dot-color: rgba(15, 23, 42, 0.08);
}

:global(:root[data-theme='dark']) {
	--account-bg:
		radial-gradient(circle at 10% 10%, rgba(59, 130, 246, 0.15), transparent 55%),
		radial-gradient(circle at 80% 0%, rgba(244, 114, 182, 0.18), transparent 45%),
		linear-gradient(160deg, rgba(11, 18, 32, 0.98), rgba(15, 23, 42, 0.98));
	--glass-strong: rgba(17, 24, 39, 0.78);
	--glass-soft: rgba(17, 24, 39, 0.9);
	--nav-bg: rgba(17, 24, 39, 0.75);
	--surface-soft: rgba(148, 163, 184, 0.12);
	--border-soft: rgba(148, 163, 184, 0.2);
	--dot-color: rgba(148, 163, 184, 0.2);
}

.account {
	width: 100%;
	max-width: none;
	height: 100%;
	min-height: 0;
	display: grid;
	grid-template-columns: minmax(220px, 320px) minmax(0, 1fr);
	gap: 2rem;
	background: var(--account-bg);
	border-radius: 28px;
	padding: 1.5rem;
	position: relative;
	overflow: hidden;
}

.account::after {
	content: '';
	position: absolute;
	inset: 0;
	pointer-events: none;
	background-image: radial-gradient(var(--dot-color) 0.5px, transparent 0.5px);
	background-size: 24px 24px;
	opacity: 0.35;
}

.content {
	min-width: 0;
	min-height: 0;
	position: relative;
	z-index: 1;
	overflow: auto;
}

.content.personalization-layout {
	overflow: hidden;
}

.content.immersive :deep(.panel) {
	background: var(--glass-soft);
}

.panel-full {
	height: 100%;
	padding: 0;
	background: transparent;
	border: none;
	box-shadow: none;
	min-height: 0;
	overflow: hidden;
}

@media (max-width: 960px) {
	.account {
		grid-template-columns: 1fr;
		padding: 1rem;
		height: auto;
		overflow: visible;
	}

	.content.personalization-layout {
		overflow: auto;
	}

	.panel-full {
		height: auto;
		overflow: visible;
	}
}

.slide-in-enter-active {
	transition: all 0.4s ease;
}

.slide-in-enter-from {
	opacity: 0;
	transform: translateY(20px);
}

.slide-in-enter-to {
	opacity: 1;
	transform: translateX(0);
}

.slide-in-leave-active {
	display: none;
}
</style>
