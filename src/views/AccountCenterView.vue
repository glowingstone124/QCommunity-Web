<script setup>
import { computed, onMounted, ref, watch } from 'vue'
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
import AccountKotshiPanel from '@/components/account/AccountKotshiPanel.vue'
import AffiliatedAccountComponent from '@/components/AffiliatedAccountComponent.vue'
import TaFeatureNotice from '@/components/account/TaFeatureNotice.vue'
import TaUpgradeCard from '@/components/account/TaUpgradeCard.vue'
import { buildOptionalAuthHeaders, computeTaUpgradeState, normalizeAccountType } from '@/utils/taAccess.js'
import PlayerCardsListComponent from '@/components/PlayerCardsListComponent.vue'
import { useIpAddressValidation } from '@/composables/useIpAddressValidation.js'
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
const { isValidIp } = useIpAddressValidation(ipAddr)
const isSubmittingIp = ref(false)
const isLoadingIps = ref(false)
const deletingIp = ref('')
const ipFeedback = ref('')
const ipFeedbackType = ref('')
const isImmersive = ref(true)
const isFrozen = ref(null)
const statusHint = ref('')
const fallenSelection = ref(null)
const kotshiQueryEnabled = ref(true)
const kotshiQuerySettingLoaded = ref(false)
const kotshiQuerySettingSaving = ref(false)
const qbotActiveResponseEnabled = ref(true)
const qbotActiveResponseSettingLoaded = ref(false)
const qbotActiveResponseSettingSaving = ref(false)
const kotshiQuota = ref(null)
const kotshiUsage = ref(null)
const kotshiRecentUsage = ref([])
const kotshiByChannel = ref({})
const isLoadingKotshi = ref(false)
const kotshiFeedback = ref('')
const kotshiFeedbackType = ref('')
const accountType = ref('qo')
const requiredPlaytime = ref(180)
const taSubmittingBind = ref(false)
const taUpgradeError = ref('')
const taPendingCommand = ref('')
const taUpgradeState = computed(() =>
	computeTaUpgradeState({
		account_type: accountType.value,
		playtime: playtime.value,
		required_playtime: requiredPlaytime.value,
	}),
)

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
			accountType.value = normalizeAccountType(data)
			requiredPlaytime.value = Number(data.required_playtime || 180)
			if (accountType.value === 'ta') {
				isFrozen.value = data.frozen === true
				statusHint.value = isFrozen.value ? t('accountPage.statusFrozen') : t('accountPage.statusNormal')
			}
			if (typeof data.kotshi_query_enabled === 'boolean') {
				kotshiQueryEnabled.value = data.kotshi_query_enabled
				kotshiQuerySettingLoaded.value = true
			}
			if (typeof data.active_response_enabled === 'boolean') {
				qbotActiveResponseEnabled.value = data.active_response_enabled
				qbotActiveResponseSettingLoaded.value = true
			} else if (typeof data.qbot_active_response_enabled === 'boolean') {
				qbotActiveResponseEnabled.value = data.qbot_active_response_enabled
				qbotActiveResponseSettingLoaded.value = true
			}
			queryAccountStatus()
		})
	queryFallenTeam()
}

function setKotshiFeedback(message, type = 'error') {
	kotshiFeedback.value = message
	kotshiFeedbackType.value = type
}

async function queryKotshiData() {
	if (isLoadingKotshi.value) return
	isLoadingKotshi.value = true
	kotshiFeedback.value = ''
	try {
		const response = await fetch('https://api.qoriginal.vip/qo/authorization/account/kotshi', {
			headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
		})
		const data = await response.json()
		if (!response.ok) throw new Error(data?.message || t('kotshiPage.loadFailed'))
		kotshiQueryEnabled.value = data.kotshi_query_enabled !== false
		kotshiQuerySettingLoaded.value = true
		qbotActiveResponseEnabled.value = data.active_response_enabled !== false && data.qbot_active_response_enabled !== false
		qbotActiveResponseSettingLoaded.value = true
		kotshiQuota.value = data.quota || null
		kotshiUsage.value = data.usage || null
		kotshiRecentUsage.value = Array.isArray(data.recent_usage) ? data.recent_usage : []
		kotshiByChannel.value = data.by_channel || {}
	} catch (error) {
		console.error('加载 Kotshi 信息失败:', error)
		setKotshiFeedback(error.message || t('kotshiPage.loadFailed'))
	} finally {
		isLoadingKotshi.value = false
	}
}

async function updateKotshiQueryEnabled(enabled) {
	if (!kotshiQuerySettingLoaded.value || kotshiQuerySettingSaving.value) return
	const previous = kotshiQueryEnabled.value
	kotshiQueryEnabled.value = enabled
	kotshiQuerySettingSaving.value = true
	kotshiFeedback.value = ''
	try {
		const response = await fetch('https://api.qoriginal.vip/qo/authorization/account/kotshi', {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ kotshi_query_enabled: enabled }),
		})
		const data = await response.json()
		if (!response.ok) throw new Error(data?.message || t('preferencesPage.saveFailed'))
		kotshiQueryEnabled.value = data.kotshi_query_enabled !== false
		setKotshiFeedback(t('preferencesPage.saved'), 'success')
	} catch (error) {
		kotshiQueryEnabled.value = previous
		setKotshiFeedback(error.message || t('preferencesPage.saveFailed'))
	} finally {
		kotshiQuerySettingSaving.value = false
	}
}

async function updateQbotActiveResponseEnabled(enabled) {
	if (qbotActiveResponseSettingSaving.value) return
	const previous = qbotActiveResponseEnabled.value
	qbotActiveResponseEnabled.value = enabled
	qbotActiveResponseSettingSaving.value = true
	kotshiFeedback.value = ''
	try {
		const response = await fetch('https://api.qoriginal.vip/qo/authorization/account/kotshi', {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				active_response_enabled: enabled,
				qbot_active_response_enabled: enabled,
			}),
		})
		const data = await response.json()
		if (!response.ok) throw new Error(data?.message || t('preferencesPage.saveFailed'))
		qbotActiveResponseEnabled.value = data.active_response_enabled !== false && data.qbot_active_response_enabled !== false
		setKotshiFeedback(t('preferencesPage.saved'), 'success')
	} catch (error) {
		qbotActiveResponseEnabled.value = previous
		setKotshiFeedback(error.message || t('preferencesPage.saveFailed'))
	} finally {
		qbotActiveResponseSettingSaving.value = false
	}
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
	if (!username.value || accountType.value === 'ta') {
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

async function submitTaBindQq(qq) {
	if (taSubmittingBind.value) return
	taSubmittingBind.value = true
	taUpgradeError.value = ''
	try {
		const res = await fetch('https://api.qoriginal.vip/qo/authorization/ta/bind-qq', {
			method: 'POST',
			headers: buildOptionalAuthHeaders({ 'Content-Type': 'application/json' }),
			body: JSON.stringify({ qq }),
		})
		const data = await res.json().catch(() => ({}))
		if (res.status === 403 && data?.code === 'INSUFFICIENT_PLAYTIME') {
			taUpgradeError.value = data.message || t('taAccount.insufficientPlaytime', {
				current: playtime.value,
				required: requiredPlaytime.value,
			})
			return
		}
		if (!res.ok || data?.result !== true) {
			taUpgradeError.value = data?.message || t('taAccount.bindFailed')
			return
		}
		taPendingCommand.value = data.command || (data.token ? `.approve-register ${data.token}` : '')
	} catch (error) {
		console.error('提交 TA QQ 绑定失败:', error)
		taUpgradeError.value = t('accountPage.connectFailed')
	} finally {
		taSubmittingBind.value = false
	}
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

function logout() {
	localStorage.removeItem('username')
	localStorage.removeItem('token')
	localStorage.removeItem('user')
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
			isImmersive.value = false
			break
		case 4:
			isImmersive.value = false
			queryKotshiData()
			break
		case 5:
			isImmersive.value = false
			queryKotshiData()
			break
	}
})

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
				<div v-if="currentSetting === 0" key="account-info" :class="{ 'overview-stack': accountType === 'ta' }">
					<TaUpgradeCard
						v-if="accountType === 'ta'"
						:playtime="taUpgradeState.playtime"
						:required-playtime="taUpgradeState.requiredPlaytime"
						:remaining-minutes="taUpgradeState.remainingMinutes"
						:progress-percent="taUpgradeState.progressPercent"
						:can-upgrade="taUpgradeState.canUpgrade"
						:submitting="taSubmittingBind"
						:error-message="taUpgradeError"
						:pending-command="taPendingCommand"
						@submit-bind="submitTaBindQq"
					/>
					<AccountOverviewPanel
						:username="username"
						:uid="uid ?? 0"
						:playtime="playtime"
						:statistics="statistics"
						:logins="logins"
						:is-frozen="isFrozen"
						:status-hint="statusHint"
						:fallen-selection="fallenSelection"
					/>
				</div>
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
					<div v-if="accountType === 'ta'" class="ta-panel-center">
						<TaFeatureNotice
							:title="t('taAccount.featureGateTitle')"
							:message="t('taAccount.featureGateAffiliated', { required: requiredPlaytime })"
							:action-label="t('taAccount.goOverview')"
							@action="selectTab(0)"
						/>
					</div>
					<AffiliatedAccountComponent v-else />
				</section>
			</transition>

			<transition name="slide-in">
				<AccountPreferencesPanel
					v-if="currentSetting === 4"
					key="preferences"
					:kotshi-query-enabled="kotshiQueryEnabled"
					:kotshi-query-setting-loaded="kotshiQuerySettingLoaded"
					:kotshi-query-setting-saving="kotshiQuerySettingSaving"
					:kotshi-query-setting-feedback="kotshiFeedback"
					:kotshi-query-setting-feedback-type="kotshiFeedbackType"
					:qbot-active-response-enabled="qbotActiveResponseEnabled"
					:qbot-active-response-setting-loaded="qbotActiveResponseSettingLoaded"
					:qbot-active-response-setting-saving="qbotActiveResponseSettingSaving"
					@update:kotshi-query-enabled="updateKotshiQueryEnabled"
					@update:qbot-active-response-enabled="updateQbotActiveResponseEnabled"
				/>
			</transition>

			<transition name="slide-in">
				<section v-if="currentSetting === 5 && accountType === 'ta'" key="kotshi-ta-gate" class="panel panel-full">
					<div class="ta-panel-center">
						<TaFeatureNotice
							:title="t('taAccount.featureGateTitle')"
							:message="t('taAccount.featureGateKotshi', { required: requiredPlaytime })"
							:action-label="t('taAccount.goOverview')"
							@action="selectTab(0)"
						/>
					</div>
				</section>
				<AccountKotshiPanel
					v-else-if="currentSetting === 5"
					key="kotshi"
					:quota="kotshiQuota"
					:usage="kotshiUsage"
					:recent-usage="kotshiRecentUsage"
					:by-channel="kotshiByChannel"
					:is-loading="isLoadingKotshi"
					:feedback="kotshiFeedback"
					:feedback-type="kotshiFeedbackType"
					:kotshi-query-enabled="kotshiQueryEnabled"
					:kotshi-query-setting-loaded="kotshiQuerySettingLoaded"
					:kotshi-query-setting-saving="kotshiQuerySettingSaving"
					:qbot-active-response-enabled="qbotActiveResponseEnabled"
					:qbot-active-response-setting-loaded="qbotActiveResponseSettingLoaded"
					:qbot-active-response-setting-saving="qbotActiveResponseSettingSaving"
					@refresh="queryKotshiData"
					@update:kotshi-query-enabled="updateKotshiQueryEnabled"
					@update:qbot-active-response-enabled="updateQbotActiveResponseEnabled"
				/>
			</transition>
		</main>
	</div>
</template>

<style scoped src="./AccountCenterView.css"></style>
