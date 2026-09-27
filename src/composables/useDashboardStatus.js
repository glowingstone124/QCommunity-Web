import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchServerStatus, subscribeServerStatus } from '@/services/serverStatus.js'
import { fetchAvatar } from '@/services/avatar.js'

export function useDashboardStatus() {
	const POLLING_INTERVAL = 3000
	const { t, locale } = useI18n()

	const servers = [
		{ id: 1, nameKey: 'dashboardPage.serverSurvival', description: '/server survival' },
		{ id: 4, nameKey: 'dashboardPage.serverCreative', description: '/server creative' },
	]

	const currentServerId = ref(1)
	const onlineCount = ref(0)
	const totalCount = ref(0)
	const msptRaw = ref(0)
	const msptSamplesRaw = ref([])
	const players = ref([])
	const playerAvatars = ref({})
	const isLoading = ref(false)
	const lastUpdatedAt = ref(null)
	const fetchError = ref('')
	let statusSubscription = null
	let fallbackPollingTimer = 0
	let errorCount = 0
	const avatarCache = new Map()

	const currentServer = computed(() =>
		servers.find((server) => server.id === currentServerId.value) || servers[0]
	)

	const serverLoad = computed(() => {
		if (!totalCount.value) {
			return 0
		}

		return Math.min(100, Math.round((onlineCount.value / totalCount.value) * 100))
	})

	function toMilliseconds(value) {
		const number = Number(value)

		// The status endpoint reports MSPT in milliseconds, including sub-millisecond values.
		return Number.isFinite(number) ? Math.max(0, number) : 0
	}

	const msptNumber = computed(() => toMilliseconds(msptRaw.value))
	const msptSamples = computed(() => msptSamplesRaw.value.map(toMilliseconds))
	const msptAverage = computed(() => {
		if (!msptSamples.value.length) {
			return msptNumber.value
		}

		return msptSamples.value.reduce((sum, value) => sum + value, 0) / msptSamples.value.length
	})
	const msptChartMax = computed(() =>
		Math.max(50, msptNumber.value, ...msptSamples.value, 1)
	)
	const msptBars = computed(() => msptSamples.value.map((value, index) => ({
		index,
		value,
		height: Math.max(2, (value / msptChartMax.value) * 100),
		className: value >= 50 ? 'warning' : value > 35 ? 'notice' : 'normal',
	})))
	const msptPeak = computed(() => Math.max(msptNumber.value, ...msptSamples.value, 0))
	const msptLoad = computed(() =>
		Math.min(100, Math.max(0, Math.round((msptNumber.value / 50) * 100)))
	)

	function formatMspt(value) {
		const number = Number(value) || 0

		return number < 1 ? number.toFixed(3) : number.toFixed(2)
	}

	const performanceState = computed(() => {
		if (fetchError.value) {
			return { label: t('dashboardPage.statusOffline'), className: 'danger' }
		}

		if (msptNumber.value > 50) {
			return { label: t('dashboardPage.statusHighLoad'), className: 'warning' }
		}

		if (msptNumber.value > 35) {
			return { label: t('dashboardPage.statusBusy'), className: 'notice' }
		}

		return { label: t('dashboardPage.statusHealthy'), className: 'ok' }
	})

	const lastUpdatedText = computed(() => {
		if (!lastUpdatedAt.value) {
			return t('dashboardPage.waiting')
		}

		return lastUpdatedAt.value.toLocaleTimeString(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		})
	})

	const statCards = computed(() => [
		{
			key: 'online',
			label: t('dashboardPage.onlineCount'),
			value: onlineCount.value,
			helper: t('dashboardPage.onlinePlayers'),
		},
		{
			key: 'total',
			label: t('dashboardPage.totalAccounts'),
			value: totalCount.value,
			helper: t('dashboardPage.recordedAccounts'),
		},
		{
			key: 'mspt',
			label: 'MSPT',
			value: formatMspt(msptNumber.value),
			helper: `${msptLoad.value}% / 50ms`,
			load: msptLoad.value,
			loadScale: msptLoad.value / 100,
		},
	])

	function formatCoordinate(value) {
		const number = Number(value)

		if (!Number.isFinite(number)) {
			return '-'
		}

		return Math.round(number)
	}

	function formatHealth(value) {
		const number = Number(value)

		if (!Number.isFinite(number)) {
			return '-'
		}

		return number.toFixed(1)
	}

	async function getPlayerAvatar(name) {
		if (!name) {
			return null
		}

		if (avatarCache.has(name)) {
			return avatarCache.get(name)
		}

		try {
			const data = await fetchAvatar(name)
			const avatar = data?.url
				? {
					url: data.url,
					special: data.special === true,
				}
				: null
			avatarCache.set(name, avatar)
			return avatar
		} catch (error) {
			console.error('Error fetching avatar:', error)
			avatarCache.set(name, null)
			return null
		}
	}

	async function syncPlayerAvatars(playerList) {
		const entries = await Promise.all(
			playerList.map(async (player) => [player.name, await getPlayerAvatar(player.name)])
		)

		playerAvatars.value = Object.fromEntries(entries.filter(([name, avatar]) => name && avatar?.url))
	}

	function selectServer(serverId) {
		if (currentServerId.value === serverId) {
			return
		}

		currentServerId.value = serverId
	}

	function applyStatusResult(result) {
		onlineCount.value = Number(result.onlinecount || 0)
		totalCount.value = Number(result.totalcount || 0)
		// Prefer the plugin's rolling average. Older servers only expose `mspt`.
		const rawMspt = Number(result.mspt_3s ?? result.mspt ?? 0)
		msptRaw.value = rawMspt
		msptSamplesRaw.value = Array.isArray(result.recent60) ? result.recent60 : []
		players.value = Array.isArray(result.players) ? result.players : []
		syncPlayerAvatars(players.value)
		lastUpdatedAt.value = new Date()
		fetchError.value = ''
		isLoading.value = false
		errorCount = 0
	}

	function handleStreamError() {
		errorCount++
		if (!lastUpdatedAt.value || errorCount >= 3) {
			fetchError.value = t('dashboardPage.statusSyncFailed')
		}
		if (errorCount >= 3 && !fallbackPollingTimer) {
			fallbackPollingTimer = window.setInterval(async () => {
				try {
					const result = await fetchServerStatus(currentServerId.value)
					applyStatusResult(result)
				} catch (_) {
					// Retain current UI state on transient network error.
				}
			}, POLLING_INTERVAL)
		}
	}

	function startStatusStream() {
		stopStatusStream()
		isLoading.value = true

		statusSubscription = subscribeServerStatus(currentServerId.value, {
			onOpen: () => {
				if (fallbackPollingTimer) {
					window.clearInterval(fallbackPollingTimer)
					fallbackPollingTimer = 0
				}
			},
			onMessage: (data) => {
				applyStatusResult(data)
			},
			onError: () => {
				handleStreamError()
			},
		})
	}

	function stopStatusStream() {
		if (statusSubscription) {
			statusSubscription.close()
			statusSubscription = null
		}
		if (fallbackPollingTimer) {
			window.clearInterval(fallbackPollingTimer)
			fallbackPollingTimer = 0
		}
		errorCount = 0
	}

	watch(currentServerId, () => {
		stopStatusStream()
		startStatusStream()
	})

	onMounted(startStatusStream)
	onBeforeUnmount(stopStatusStream)

	return {
		POLLING_INTERVAL,
		currentServer,
		currentServerId,
		fetchError,
		formatCoordinate,
		formatHealth,
		formatMspt,
		isLoading,
		lastUpdatedText,
		msptAverage,
		msptBars,
		msptChartMax,
		msptNumber,
		msptPeak,
		onlineCount,
		performanceState,
		playerAvatars,
		players,
		selectServer,
		servers,
		serverLoad,
		statCards,
		t,
		totalCount,
	}
}
