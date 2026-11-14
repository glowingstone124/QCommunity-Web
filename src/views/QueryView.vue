<script setup>
import { computed, ref } from 'vue'
import debounce from 'lodash/debounce'
import { useI18n } from 'vue-i18n'
import TaFeatureNotice from '@/components/account/TaFeatureNotice.vue'
import { buildOptionalAuthHeaders, parseTaRestrictedResponse } from '@/utils/taAccess.js'
import PlayerInfoCard from '@/components/PlayerCard.vue'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'
import UiSearchField from '@/components/ui/UiSearchField.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiStatePanel from '@/components/ui/UiStatePanel.vue'
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
const taRestrictedMessage = ref('')
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
		taRestrictedMessage.value = ''
		const response = await fetch(`https://api.glowingstone.cn/qo/download/registry?name=${encodeURIComponent(id)}`, {
			headers: buildOptionalAuthHeaders({ Accept: 'application/json' }),
		})
		const data = await response.json().catch(() => ({}))
		const taGate = parseTaRestrictedResponse(response.status, data)
		if (taGate.restricted) {
			taRestrictedMessage.value = taGate.message || t('queryPage.taRestrictedFallback')
			errorMessage.value = ''
			return
		}

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
	<div class="query-page page-shell">
		<UiPageHeader
			class="query-page__header"
			:title="t('queryPage.title')"
			:subtitle="t('queryPage.description')"
		/>

		<section class="query-shell">
			<div class="query-panel">
				<UiSearchField
					v-model="inputId"
					:label="t('queryPage.playerId')"
					:placeholder="t('queryPage.placeholder')"
					@update:model-value="handleSearch"
					@submit="submitSearch"
				>
					<template #actions>
						<UiButton
							variant="filled"
							icon="search"
							:loading="loading"
							:disabled="!canSearch"
							@click="submitSearch"
						>
							{{ loading ? t('queryPage.searching') : t('queryPage.search') }}
						</UiButton>
					</template>
				</UiSearchField>
			</div>

			<section class="result-panel">
				<UiStatePanel
					v-if="!searched"
					state="info"
					icon="person_search"
					:title="t('queryPage.waitingTitle')"
					:message="t('queryPage.waitingDescription')"
				/>

				<UiStatePanel
					v-else-if="loading"
					state="loading"
					:title="t('queryPage.loadingTitle')"
					:message="t('queryPage.loadingDescription')"
				/>

				<TaFeatureNotice
					v-else-if="taRestrictedMessage"
					:title="t('queryPage.taRestrictedTitle')"
					:message="taRestrictedMessage"
					:action-label="t('queryPage.goAccountCenter')"
					action-route="/account"
				/>

				<UiStatePanel
					v-else-if="errorMessage"
					state="error"
					:title="t('queryPage.failedTitle')"
					:message="errorMessage"
					:action-label="t('queryPage.search')"
					@action="submitSearch"
				/>

				<UiStatePanel
					v-else-if="!found"
					state="empty"
					icon="person_off"
					:title="t('queryPage.notFoundTitle')"
					:message="t('queryPage.notFound', { id: queryId })"
				/>

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
	</div>
</template>

<style scoped src="./QueryView.css"></style>
