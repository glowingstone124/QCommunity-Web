<script setup>
import { computed, ref } from 'vue'
import debounce from 'lodash/debounce'
import { useI18n } from 'vue-i18n'
import PlayerInfoCard from '@/components/PlayerCard.vue'
import { fetchAvatar } from '@/services/avatar.js'

const inputId = ref('')
const { t } = useI18n()
const queryId = ref('')
const avatarUrl = ref('https://crafthead.net/avatar/8667ba71b85a4004af54457a9734eed7')
const qq = ref('')
const online = ref(false)
const banned = ref(false)
const found = ref(false)
const searched = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const playtime = ref(0)
const lastLogin = ref(null)
const statistics = ref({})
const affiliated = ref(false)
const host = ref('')

const canSearch = computed(() => inputId.value.trim().length > 0 && !loading.value)

function resetResult() {
	avatarUrl.value = 'https://crafthead.net/avatar/8667ba71b85a4004af54457a9734eed7'
	qq.value = ''
	online.value = false
	banned.value = false
	found.value = false
	affiliated.value = false
	host.value = ''
	playtime.value = 0
	lastLogin.value = null
	statistics.value = {}
	errorMessage.value = ''
}

async function getAvatar(name) {
	try {
		const avatar = await fetchAvatar(name)
		if (avatar?.special === true) {
			avatarUrl.value = avatar.url || ''
			return
		}

		avatarUrl.value = avatar?.url || avatarUrl.value
	} catch (error) {
		console.error('Error fetching avatar:', error)
	}
}

async function getPlayer(id) {
	loading.value = true
	searched.value = true
	resetResult()

	try {
		const response = await fetch(`https://api.glowingstone.cn/qo/download/registry?name=${encodeURIComponent(id)}`)
		const data = await response.json()

		if (data.code === 1) {
			found.value = false
			return
		}

		if (data.affiliated === true) {
			affiliated.value = true
			found.value = true
			host.value = data.host || ''
			return
		}

		found.value = true
		qq.value = data.qq || ''
		online.value = data.online === true
		banned.value = data.frozen === true
		playtime.value = data.playtime || 0
		lastLogin.value = data.last_login ?? null
		statistics.value = data.statistics || {}
		await getAvatar(id)
	} catch (error) {
		console.error('Error fetching query:', error)
		errorMessage.value = t('queryPage.loadFailed')
	} finally {
		loading.value = false
	}
}

const handleSearch = debounce(async () => {
	const nextQuery = inputId.value.trim()
	if (!nextQuery) {
		return
	}

	queryId.value = nextQuery
	await getPlayer(nextQuery)
}, 180)

function submitSearch() {
	handleSearch.cancel()
	handleSearch()
}
</script>

<template>
	<main class="query-page page-shell">
		<section class="query-shell">
			<div class="query-panel">
				<div class="panel-heading">
					<h1>{{ t('queryPage.title') }}</h1>
					<p>{{ t('queryPage.description') }}</p>
				</div>

				<form class="search-form" @submit.prevent="submitSearch">
					<label class="search-field">
						<span>{{ t('queryPage.playerId') }}</span>
						<input
							v-model="inputId"
							type="text"
							:placeholder="t('queryPage.placeholder')"
							autocomplete="off"
							@input="handleSearch"
						/>
					</label>
					<button type="submit" class="search-btn" :disabled="!canSearch">
						{{ loading ? t('queryPage.searching') : t('queryPage.search') }}
					</button>
				</form>
			</div>

			<section class="result-panel">
				<div v-if="!searched" class="empty-state">
					<h2>{{ t('queryPage.waitingTitle') }}</h2>
					<p>{{ t('queryPage.waitingDescription') }}</p>
				</div>

				<div v-else-if="loading" class="empty-state">
					<h2>{{ t('queryPage.loadingTitle') }}</h2>
					<p>{{ t('queryPage.loadingDescription') }}</p>
				</div>

				<div v-else-if="errorMessage" class="empty-state error">
					<h2>{{ t('queryPage.failedTitle') }}</h2>
					<p>{{ errorMessage }}</p>
				</div>

				<div v-else-if="!found" class="empty-state">
					<h2>{{ t('queryPage.notFoundTitle') }}</h2>
					<p>{{ t('queryPage.notFound', { id: queryId }) }}</p>
				</div>

				<div v-else-if="affiliated" class="affiliated-result">
					<div class="result-heading">
						<span class="result-label">{{ t('queryPage.affiliated') }}</span>
						<h2>{{ queryId }}</h2>
						<p>{{ t('queryPage.affiliatedDescription', { host: host || t('queryPage.unknown') }) }}</p>
					</div>
					<div class="affiliated-row">
						<span>{{ t('queryPage.mainAccount') }}</span>
						<strong>{{ host || '—' }}</strong>
					</div>
				</div>

				<PlayerInfoCard
					v-else
					:username="queryId"
					:banned="banned"
					:online="online"
					:qq="qq"
					:found="found"
					:avatar="avatarUrl"
					:playtime="playtime"
					:last-login="lastLogin"
					:statistics="statistics"
				/>
			</section>
		</section>
	</main>
</template>

<style scoped src="./QueryView.css"></style>
