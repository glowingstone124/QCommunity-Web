<script setup>
import {computed, onBeforeUnmount, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRouter} from 'vue-router'
import FallenLiveStatus from '@/components/fallen/FallenLiveStatus.vue'
import {collapseSchedule} from '@/data/collapse.js'
import {getFallenActivityStatus, getFallenTeamSelection, selectFallenTeam} from '@/services/fallen.js'

const {locale, t} = useI18n()
const router = useRouter()
const isDevMode = import.meta.env.DEV
const loading = ref(true)
const submitting = ref(false)
const selection = ref(null)
const pendingTeam = ref(null)
const message = ref('')
const errorMessage = ref('')
const celebrating = ref(false)
const activityStatus = ref(null)
const activityChecked = ref(false)
const loggedIn = computed(() => Boolean(localStorage.getItem('token')))
const activityActive = computed(() => activityStatus.value?.active === true)
let celebrationTimer = 0
let statusPollingTimer = 0
let statusRequestInFlight = false

const STATUS_POLL_INTERVAL = 1_000

const teams = [
	{
		id: 'A',
		name: {zh: '旧城同盟', en: 'Old City Alliance'},
		location: {zh: '旧主城 + 芙岛', en: 'Old Spawn + Fu Island'},
		perk: {zh: '领地内移动速度 +5%', en: '+5% movement speed in your territory'},
		description: {zh: '横跨旧主城与芙岛的双城阵线，依靠机动与固定传送站快速支援。', en: 'A two-city front built around mobility and fixed transit stations.'},
		image: 'https://bucket.glowingstone.cn/group_oldcity.png',
		accent: '#b85f4a',
	},
	{
		id: 'B',
		name: {zh: '主城守望', en: 'Main City'},
		location: {zh: '主城', en: 'Main City'},
		perk: {zh: '降低饥饿值消耗', en: 'Reduced hunger consumption'},
		description: {zh: '盘踞主城核心地带，以稳定补给和密集建筑群构筑持久防线。', en: 'A fortified central faction sustained by reliable supplies and dense city blocks.'},
		image: 'https://bucket.glowingstone.cn/group_maincity.png',
		accent: '#3978c5',
	},
	{
		id: 'C',
		name: {zh: '锡城联合', en: 'Tin City Union'},
		location: {zh: '锡城及周边区域', en: 'Tin City and surrounding territory'},
		perk: {zh: '木材、泥土与石质方块挖掘速度 +10%', en: '+10% mining speed for wood, dirt and stone'},
		description: {zh: '以锡城工业与资源区为腹地，用更高的采掘效率迅速扩张工事。', en: 'An industrial faction that turns faster resource gathering into rapid expansion.'},
		image: 'https://bucket.glowingstone.cn/group_hitcity.png',
		accent: '#3e9867',
	},
]

const currentTeam = computed(() => teams.find((team) => team.id === selection.value?.team) || null)
const expectedTeam = computed(() => teams.find((team) => team.id === selection.value?.expectedTeam) || null)
const pending = computed(() => teams.find((team) => team.id === pendingTeam.value) || null)
const text = computed(() => ({
	title: t('collapsePage.chooseFaction'),
	intro: t('collapsePage.registerPreference'),
	locked: selection.value?.finalized ? t('collapsePage.factionAssigned') : t('collapsePage.preferenceRegistered'),
	selected: selection.value?.finalized
		? t('collapsePage.assignedDescription')
		: t('collapsePage.preferenceDescription', {date: collapseSchedule.startDateShortText[locale.value] || collapseSchedule.startDateShortText.zh}),
	choose: t('collapsePage.registerPreferred'),
	confirmTitle: t('collapsePage.confirmPreference'),
	confirmBody: t('collapsePage.confirmBody', {team: pending.value ? localized(pending.value.name) : t('collapsePage.factionOptions')}),
	cancel: t('collapsePage.review'),
	confirm: t('collapsePage.confirmJoin'),
	login: t('collapsePage.loginToChoose'),
	rules: t('collapsePage.rules'),
}))

const scheduleText = computed(() => ({
	label: t('collapsePage.fullReleaseNotice'),
	title: t('collapsePage.fullReleaseTitle'),
	detail: t('collapsePage.fullReleaseDescription'),
}))

const heroText = computed(() => activityActive.value
	? {
		title: t('collapsePage.liveTitle'),
		intro: t('collapsePage.liveDescription'),
	}
	: text.value)

function localized(value) {
	return value[locale.value] || value.zh
}

function openConfirmation(team) {
	if (selection.value || submitting.value) return
	if (!isDevMode && !localStorage.getItem('token')) {
		router.push({path: '/login', query: {redirect: '/collapse'}})
		return
	}
	pendingTeam.value = team.id
	errorMessage.value = ''
}

async function confirmSelection() {
	if (!pendingTeam.value || submitting.value) return
	submitting.value = true
	errorMessage.value = ''
	try {
		if (isDevMode) {
			await new Promise((resolve) => window.setTimeout(resolve, 520))
			selection.value = {
				selected: true,
				team: pendingTeam.value,
				expectedTeam: pendingTeam.value,
				finalized: false,
				selectedAt: Date.now(),
			}
				message.value = t('collapsePage.devPreview')
			triggerCelebration()
			pendingTeam.value = null
			return
		}
		const result = await selectFallenTeam(pendingTeam.value)
		selection.value = result
		message.value = result.message || text.value.selected
		triggerCelebration()
		pendingTeam.value = null
	} catch (error) {
		if (error.status === 401) {
			await router.push({path: '/login', query: {redirect: '/collapse'}})
			return
		}
		if (error.status === 409 && error.data?.team) {
			selection.value = error.data
			pendingTeam.value = null
		}
		errorMessage.value = error.message
	} finally {
		submitting.value = false
	}
}

function triggerCelebration() {
	window.clearTimeout(celebrationTimer)
	celebrating.value = true
	celebrationTimer = window.setTimeout(() => {
		celebrating.value = false
	}, 1800)
}

function resetDevPreview() {
	if (!isDevMode) return
	selection.value = null
	pendingTeam.value = null
	message.value = ''
	errorMessage.value = ''
}

async function syncActivityStatus() {
	if (statusRequestInFlight) return
	statusRequestInFlight = true
	try {
		activityStatus.value = await getFallenActivityStatus()
	} catch (error) {
		if (activityStatus.value?.active) {
			activityStatus.value = {...activityStatus.value, stale: true}
		}
	} finally {
		activityChecked.value = true
		statusRequestInFlight = false
	}
}

function startActivityPolling() {
	syncActivityStatus()
	statusPollingTimer = window.setInterval(syncActivityStatus, STATUS_POLL_INTERVAL)
}

onMounted(async () => {
	startActivityPolling()
	if (isDevMode) {
		loading.value = false
		return
	}
	if (!localStorage.getItem('token')) {
		loading.value = false
		return
	}
	try {
		const result = await getFallenTeamSelection()
		if (result.selected) selection.value = result
	} catch (error) {
		if (error.status === 401) {
			localStorage.removeItem('token')
		}
		errorMessage.value = error.message
	} finally {
		loading.value = false
	}
})

onBeforeUnmount(() => {
	window.clearTimeout(celebrationTimer)
	window.clearInterval(statusPollingTimer)
})
</script>

<template>
	<div class="fallen-page">
		<div class="atmosphere" aria-hidden="true"></div>
		<header class="fallen-hero">
			<div>
				<h1>{{ heroText.title }}</h1>
				<p class="intro">{{ heroText.intro }}</p>
				<p v-if="isDevMode && !activityActive" class="dev-banner">
					{{ t('collapsePage.devPreview') }}
				</p>
			</div>
			<router-link class="rules-link" to="/news/2026collapse">{{ text.rules }} <span>↗</span></router-link>
		</header>

		<FallenLiveStatus v-if="activityActive" :status="activityStatus" :locale="locale" />

		<section v-if="!activityActive" class="schedule-notice" aria-labelledby="collapse-schedule-title">
			<div>
				<h2 id="collapse-schedule-title">{{ scheduleText.title }}</h2>
				<p>{{ scheduleText.label }}</p>
				<span>{{ scheduleText.detail }}</span>
			</div>
			<time :datetime="collapseSchedule.startDate">
				{{ collapseSchedule.startDateText[locale] || collapseSchedule.startDateText.zh }}
			</time>
		</section>

		<Transition v-if="!activityActive" name="selection-stage" mode="out-in">
			<div v-if="loading || !activityChecked" key="loading" class="loading-state" role="status">
				<span></span><span></span><span></span>
			</div>

			<section
				v-else-if="currentTeam"
				key="result"
				class="locked-panel"
				:class="{'is-celebrating': celebrating}"
				:style="{'--team-accent': currentTeam.accent}"
			>
				<img :src="currentTeam.image" :alt="localized(currentTeam.name)">
				<div class="locked-overlay"></div>
				<div v-if="celebrating" class="impact-fx" aria-hidden="true">
					<span class="impact-flash"></span>
					<span class="impact-ring impact-ring--one"></span>
					<span class="impact-ring impact-ring--two"></span>
					<span
						v-for="index in 12"
						:key="index"
						class="impact-ray"
						:style="{'--ray-index': index - 1}"
					></span>
				</div>
				<div class="locked-content">
					<h2>{{ localized(currentTeam.name) }}</h2>
					<p class="status-label">{{ text.locked }} · {{ currentTeam.id }}</p>
					<p>{{ localized(currentTeam.location) }}</p>
					<strong>{{ localized(currentTeam.perk) }}</strong>
					<small v-if="selection.finalized && expectedTeam && expectedTeam.id !== currentTeam.id">
						{{ t('collapsePage.registeredPreference', { team: localized(expectedTeam.name) }) }}
					</small>
					<span>{{ message || text.selected }}</span>
					<button v-if="isDevMode" type="button" class="reset-preview" @click="resetDevPreview">
						{{ t('collapsePage.resetPreview') }}
					</button>
				</div>
			</section>

			<section v-else key="choices" class="team-grid" :aria-label="t('collapsePage.factionOptions')">
				<article
					v-for="(team, index) in teams"
					:key="team.id"
					class="team-card"
					:class="{
						'is-pending': pendingTeam === team.id,
						'is-dimmed': pendingTeam && pendingTeam !== team.id,
					}"
					:style="{'--team-accent': team.accent, '--team-index': index}"
				>
				<div class="team-image">
					<img :src="team.image" :alt="localized(team.name)">
					<span class="team-code">0{{ team.id.charCodeAt(0) - 64 }}</span>
				</div>
				<div class="team-body">
					<h2>{{ localized(team.name) }}</h2>
					<p class="team-location">{{ localized(team.location) }}</p>
					<p class="team-description">{{ localized(team.description) }}</p>
					<div class="perk"><span>◆</span>{{ localized(team.perk) }}</div>
					<button type="button" @click="openConfirmation(team)">
						{{ loggedIn || isDevMode ? text.choose : text.login }}
						<span>→</span>
					</button>
				</div>
				</article>
			</section>
		</Transition>

		<p v-if="!activityActive && errorMessage" class="error-banner" role="alert">{{ errorMessage }}</p>

		<Transition name="confirm-pop">
			<div v-if="!activityActive && pending" class="modal-backdrop" @click.self="pendingTeam = null">
				<section class="confirm-modal" role="dialog" aria-modal="true" :aria-labelledby="'confirm-title'">
				<h2 id="confirm-title">{{ text.confirmTitle }}</h2>
				<p>{{ text.confirmBody }}</p>
				<div class="modal-actions">
					<button type="button" class="secondary" :disabled="submitting" @click="pendingTeam = null">{{ text.cancel }}</button>
					<button type="button" class="primary" :disabled="submitting" @click="confirmSelection">
						{{ submitting ? '…' : text.confirm }}
					</button>
				</div>
				</section>
			</div>
		</Transition>
	</div>
</template>

<style scoped src="./FallenTeamView.css"></style>
