<script setup>
import {computed, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRouter} from 'vue-router'
import {getFallenTeamSelection, selectFallenTeam} from '@/services/fallen.js'

const {locale} = useI18n()
const router = useRouter()
const loading = ref(true)
const submitting = ref(false)
const selection = ref(null)
const pendingTeam = ref(null)
const message = ref('')
const errorMessage = ref('')
const loggedIn = computed(() => Boolean(localStorage.getItem('token')))

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
const text = computed(() => locale.value === 'en' ? {
	eyebrow: 'FALLEN // FACTION REGISTRATION',
	title: 'Choose your desired team.',
	intro: 'Register one faction preference. Final teams will be balanced and assigned on July 29.',
	locked: selection.value?.finalized ? 'FACTION ASSIGNED' : 'PREFERENCE REGISTERED',
	selected: selection.value?.finalized ? 'Your final faction is assigned. Join the server and prepare for deployment.' : 'Your preference is registered. Final assignment will be published on July 29.',
	choose: 'Register as preference',
	confirmTitle: 'Confirm faction preference',
	confirmBody: `${pending.value?.name.en || 'This faction'} will be registered as your preference and cannot be changed. The final faction may be adjusted to keep all three teams balanced. Continue?`,
	cancel: 'Review again',
	confirm: 'Confirm faction',
	login: 'Sign in to choose',
	rules: 'Read event rules',
} : {
	eyebrow: 'FALLEN // 阵营登记',
	title: '选择你的阵营',
	intro: '登记一个阵营意向。7 月 29 日系统将在尽量尊重意向的前提下均衡分配正式阵营。',
	locked: selection.value?.finalized ? '正式阵营已确定' : '阵营意向已登记',
	selected: selection.value?.finalized ? '你的正式阵营已经确定。进入服务器，准备部署。' : '你的阵营意向已经登记，正式结果将在 7 月 29 日公布。',
	choose: '登记为首选阵营',
	confirmTitle: '确认阵营意向',
	confirmBody: `确认后会将${pending.value?.name.zh || '该阵营'}登记为你的首选且无法修改。为保证三方人数均衡，正式阵营可能调整。是否继续？`,
	cancel: '再想想',
	confirm: '确认加入',
	login: '登录后选择',
	rules: '查看完整规则',
})

function localized(value) {
	return value[locale.value] || value.zh
}

function openConfirmation(team) {
	if (selection.value || submitting.value) return
	if (!localStorage.getItem('token')) {
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
		const result = await selectFallenTeam(pendingTeam.value)
		selection.value = result
		message.value = result.message || text.value.selected
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

onMounted(async () => {
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
</script>

<template>
	<div class="fallen-page">
		<div class="atmosphere" aria-hidden="true"></div>
		<header class="fallen-hero">
			<div>
				<p class="eyebrow">{{ text.eyebrow }}</p>
				<h1>{{ text.title }}</h1>
				<p class="intro">{{ text.intro }}</p>
			</div>
			<router-link class="rules-link" to="/news/2026collapse">{{ text.rules }} <span>↗</span></router-link>
		</header>

		<div v-if="loading" class="loading-state" role="status">
			<span></span><span></span><span></span>
		</div>

		<section v-else-if="currentTeam" class="locked-panel" :style="{'--team-accent': currentTeam.accent}">
			<img :src="currentTeam.image" :alt="localized(currentTeam.name)">
			<div class="locked-overlay"></div>
			<div class="locked-content">
				<p class="status-label">● {{ text.locked }} // {{ currentTeam.id }}</p>
				<h2>{{ localized(currentTeam.name) }}</h2>
				<p>{{ localized(currentTeam.location) }}</p>
				<strong>{{ localized(currentTeam.perk) }}</strong>
				<small v-if="selection.finalized && expectedTeam && expectedTeam.id !== currentTeam.id">
					{{ locale === 'en' ? `Registered preference: ${localized(expectedTeam.name)}` : `登记意向：${localized(expectedTeam.name)}` }}
				</small>
				<span>{{ message || text.selected }}</span>
			</div>
		</section>

		<section v-else class="team-grid" aria-label="阵营选项">
			<article
				v-for="team in teams"
				:key="team.id"
				class="team-card"
				:style="{'--team-accent': team.accent}"
			>
				<div class="team-image">
					<img :src="team.image" :alt="localized(team.name)">
					<span class="team-code">0{{ team.id.charCodeAt(0) - 64 }}</span>
				</div>
				<div class="team-body">
					<p class="team-location">{{ localized(team.location) }}</p>
					<h2>{{ localized(team.name) }}</h2>
					<p class="team-description">{{ localized(team.description) }}</p>
					<div class="perk"><span>◆</span>{{ localized(team.perk) }}</div>
					<button type="button" @click="openConfirmation(team)">
						{{ loggedIn ? text.choose : text.login }}
						<span>→</span>
					</button>
				</div>
			</article>
		</section>

		<p v-if="errorMessage" class="error-banner" role="alert">{{ errorMessage }}</p>

		<div v-if="pending" class="modal-backdrop" @click.self="pendingTeam = null">
			<section class="confirm-modal" role="dialog" aria-modal="true" :aria-labelledby="'confirm-title'">
				<p class="modal-code">FALLEN / {{ pending.id }}</p>
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
	</div>
</template>

<style scoped>
.fallen-page {
	position: relative;
	min-height: 100%;
	padding: clamp(2rem, 5vw, 5rem) clamp(1rem, 4vw, 4rem) clamp(4rem, 8vw, 7rem);
	box-sizing: border-box;
	background: #090c0f;
	color: #f0eee8;
	overflow: hidden;
}

.atmosphere {
	position: absolute;
	inset: 0;
	background:
		radial-gradient(circle at 12% 12%, rgba(142, 52, 31, .2), transparent 32%),
		radial-gradient(circle at 86% 70%, rgba(37, 92, 72, .15), transparent 35%),
		repeating-linear-gradient(90deg, transparent 0, transparent calc(25% - 1px), rgba(255,255,255,.025) 25%);
	pointer-events: none;
}

.fallen-hero, .team-grid, .locked-panel, .error-banner { position: relative; z-index: 1; }
.fallen-hero { max-width: 1680px; margin: 0 auto clamp(2rem, 5vw, 4.5rem); display: flex; align-items: end; justify-content: space-between; gap: 2rem; }
.eyebrow, .modal-code { margin: 0 0 1rem; color: #d36649; font: 700 .75rem/1.2 'Space Mono', monospace; letter-spacing: .18em; }
.fallen-hero h1 { max-width: 900px; margin: 0; font-size: clamp(2.6rem, 6vw, 6.3rem); font-weight: 430; line-height: .98; letter-spacing: -.045em; }
.intro { max-width: 720px; margin: 1.4rem 0 0; color: #aaa9a4; font-size: clamp(1rem, 1.6vw, 1.22rem); line-height: 1.65; }
.rules-link { flex: none; color: #dad8d1; text-decoration: none; border-bottom: 1px solid #595854; padding: .7rem 0; font-weight: 650; }
.rules-link:hover { color: #fff; border-color: #d36649; }

.team-grid { max-width: 1680px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; background: #343638; border: 1px solid #343638; }
.team-card { min-width: 0; background: #111518; display: flex; flex-direction: column; transition: transform .25s ease, background .25s ease; }
.team-card:hover { background: #171b1e; transform: translateY(-6px); z-index: 2; }
.team-image { position: relative; aspect-ratio: 16 / 9; overflow: hidden; background: #181b1d; }
.team-image::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 45%, rgba(9,12,15,.9)); }
.team-image img { width: 100%; height: 100%; object-fit: cover; filter: saturate(.72) contrast(1.08); transition: transform .6s cubic-bezier(.2,.8,.2,1), filter .3s; }
.team-card:hover img { transform: scale(1.045); filter: saturate(1) contrast(1.04); }
.team-code { position: absolute; z-index: 1; right: 1.2rem; top: 1rem; font: 400 2.3rem/1 'Space Mono', monospace; color: rgba(255,255,255,.8); }
.team-body { display: flex; flex: 1; flex-direction: column; padding: clamp(1.3rem, 2.5vw, 2.2rem); border-top: 3px solid var(--team-accent); }
.team-location { margin: 0 0 .55rem; color: var(--team-accent); font: 700 .72rem/1.4 'Space Mono', monospace; letter-spacing: .09em; text-transform: uppercase; }
.team-body h2 { margin: 0; font-size: clamp(1.65rem, 2.7vw, 2.65rem); font-weight: 560; }
.team-description { margin: 1rem 0 1.5rem; color: #9e9e9a; line-height: 1.65; }
.perk { margin-top: auto; min-height: 2.8rem; padding: 1rem 0; border-top: 1px solid #303438; color: #dddcd6; font-size: .92rem; line-height: 1.5; }
.perk span { color: var(--team-accent); margin-right: .7rem; }
.team-body button { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 1rem; padding: 1rem 1.1rem; border: 1px solid #45494d; border-radius: 0; background: transparent; color: #f3f1eb; font: inherit; font-weight: 700; cursor: pointer; }
.team-body button:hover { background: var(--team-accent); border-color: var(--team-accent); color: #fff; }

.locked-panel { max-width: 1680px; min-height: min(600px, 58vh); margin: 0 auto; overflow: hidden; border-bottom: 5px solid var(--team-accent); display: grid; align-items: end; }
.locked-panel img, .locked-overlay { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.locked-overlay { background: linear-gradient(90deg, rgba(7,9,11,.98) 0%, rgba(7,9,11,.78) 48%, rgba(7,9,11,.15) 100%); }
.locked-content { position: relative; z-index: 1; max-width: 650px; padding: clamp(2rem, 6vw, 5rem); display: grid; gap: .75rem; }
.status-label { color: var(--team-accent); font: 700 .78rem 'Space Mono', monospace; letter-spacing: .15em; }
.locked-content h2 { margin: .4rem 0; font-size: clamp(3rem, 7vw, 6.5rem); line-height: .95; }
.locked-content p, .locked-content span { margin: 0; color: #b7b6b0; line-height: 1.6; }
.locked-content strong { margin: 1rem 0; font-size: 1.08rem; color: #fff; }

.loading-state { position: relative; z-index: 2; height: 320px; display: flex; align-items: center; justify-content: center; gap: .65rem; }
.loading-state span { width: 7px; height: 44px; background: #d36649; animation: signal 1s ease-in-out infinite; }
.loading-state span:nth-child(2) { animation-delay: .14s; }.loading-state span:nth-child(3) { animation-delay: .28s; }
@keyframes signal { 50% { height: 12px; opacity: .35; } }
.error-banner { max-width: 1680px; margin: 1rem auto 0; padding: 1rem; box-sizing: border-box; border: 1px solid #713e34; background: #241411; color: #f2a28d; }

.modal-backdrop { position: fixed; z-index: 100; inset: 0; display: grid; place-items: center; padding: 1rem; background: rgba(2,4,5,.78); backdrop-filter: blur(10px); }
.confirm-modal { width: min(520px, 100%); padding: clamp(1.5rem, 5vw, 3rem); box-sizing: border-box; background: #14181b; border: 1px solid #3d4246; border-top: 4px solid #d36649; box-shadow: 0 30px 100px rgba(0,0,0,.55); }
.confirm-modal h2 { margin: 0; font-size: clamp(1.8rem, 5vw, 2.7rem); }.confirm-modal > p:not(.modal-code) { color: #aaa9a4; line-height: 1.7; }
.modal-actions { display: grid; grid-template-columns: 1fr 1.3fr; gap: .65rem; margin-top: 2rem; }
.modal-actions button { min-height: 50px; border-radius: 0; font: inherit; font-weight: 700; cursor: pointer; }
.modal-actions .secondary { color: #d1d0ca; border: 1px solid #42474a; background: transparent; }.modal-actions .primary { color: #fff; border: 1px solid #b85238; background: #b85238; }
.modal-actions button:disabled { opacity: .55; cursor: wait; }

@media (max-width: 900px) { .team-grid { grid-template-columns: 1fr; gap: 1px; }.team-card { display: grid; grid-template-columns: minmax(280px, 1.15fr) 1fr; }.team-image { height: 100%; min-height: 260px; aspect-ratio: auto; }.fallen-hero { align-items: start; flex-direction: column; }.team-card:hover { transform: none; } }
@media (max-width: 580px) { .fallen-page { padding-top: 2.3rem; }.team-card { display: flex; }.team-image { min-height: 0; aspect-ratio: 16/9; }.rules-link { align-self: flex-start; }.locked-overlay { background: linear-gradient(0deg, rgba(7,9,11,.98), rgba(7,9,11,.25)); }.modal-actions { grid-template-columns: 1fr; }.fallen-hero h1 { font-size: 2.8rem; } }
@media (prefers-reduced-motion: reduce) { .team-card, .team-image img, .loading-state span { transition: none; animation: none; } }
</style>
