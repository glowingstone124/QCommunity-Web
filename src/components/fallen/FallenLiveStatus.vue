<script setup>
import {computed} from 'vue'

const props = defineProps({
	status: {
		type: Object,
		required: true,
	},
	locale: {
		type: String,
		default: 'zh',
	},
})

const teamDetails = {
	A: {
		name: {zh: '旧城同盟', en: 'Old City Alliance'},
		location: {zh: '旧主城 + 芙岛', en: 'Old Spawn + Fu Island'},
		accent: '#b85f4a',
	},
	B: {
		name: {zh: '主城守望', en: 'Main City'},
		location: {zh: '主城', en: 'Main City'},
		accent: '#3978c5',
	},
	C: {
		name: {zh: '锡城联合', en: 'Tin City Union'},
		location: {zh: '锡城及周边区域', en: 'Tin City and surroundings'},
		accent: '#3e9867',
	},
}

const phaseLabel = computed(() => {
	const labels = props.locale === 'en'
		? {DEPLOYMENT: 'Deployment', ACTIVE: 'In progress', OVERTIME: 'Overtime'}
		: {DEPLOYMENT: '部署阶段', ACTIVE: '活动进行中', OVERTIME: '加时阶段'}
	return labels[props.status.phase] || props.status.phase
})

const remainingTime = computed(() => {
	let seconds = Math.max(0, Math.floor(Number(props.status.remainingMillis || 0) / 1000))
	const days = Math.floor(seconds / 86400)
	seconds %= 86400
	const hours = Math.floor(seconds / 3600)
	seconds %= 3600
	const minutes = Math.floor(seconds / 60)
	seconds %= 60
	const clock = [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
	return days > 0 ? `${days}${props.locale === 'en' ? 'd' : '天'} ${clock}` : clock
})

const teams = computed(() => [...(props.status.teams || [])]
	.sort((left, right) => left.team.localeCompare(right.team))
	.map((team) => ({
		...team,
		details: teamDetails[team.team] || {
			name: {zh: `${team.team} 阵营`, en: `Team ${team.team}`},
			location: {zh: '', en: ''},
			accent: '#d36649',
		},
		players: [...(team.players || [])].sort((left, right) =>
			Number(right.online) - Number(left.online) || left.name.localeCompare(right.name)
		),
	})))

function localized(value) {
	return value?.[props.locale] || value?.zh || ''
}
</script>

<template>
	<section class="live-status" aria-live="polite">
		<header class="live-toolbar">
			<div class="live-state">
				<span class="live-dot" :class="{'is-stale': status.stale}" aria-hidden="true"></span>
				<div>
					<strong>{{ status.stale ? (locale === 'en' ? 'CONNECTION STALE' : '数据连接中断') : 'LIVE' }}</strong>
					<small>{{ phaseLabel }}</small>
				</div>
			</div>
			<div class="countdown">
				<small>{{ locale === 'en' ? 'TIME REMAINING' : '剩余时间' }}</small>
				<strong>{{ remainingTime }}</strong>
			</div>
		</header>

		<p v-if="status.stale" class="stale-notice" role="status">
			{{ locale === 'en' ? 'The server has not reported for more than five seconds. Scores may be outdated.' : '生存服已超过 5 秒未上报，当前分数可能不是最新数据。' }}
		</p>

		<div class="live-team-grid">
			<article
				v-for="team in teams"
				:key="team.team"
				class="live-team"
				:class="{'is-eliminated': team.eliminated}"
				:style="{'--team-accent': team.details.accent}"
			>
				<header class="team-heading">
					<div>
						<span class="team-id">TEAM {{ team.team }}</span>
						<h2>{{ localized(team.details.name) }}</h2>
						<p>{{ localized(team.details.location) }}</p>
					</div>
					<div class="team-score">
						<strong>{{ team.score }}</strong>
						<small>{{ locale === 'en' ? 'PTS' : '积分' }}</small>
					</div>
				</header>

				<div class="roster-heading">
					<span>{{ locale === 'en' ? 'ROSTER' : '阵营成员' }}</span>
					<span>{{ team.players.filter((player) => player.online).length }} / {{ team.players.length }} {{ locale === 'en' ? 'online' : '在线' }}</span>
				</div>
				<ul v-if="team.players.length" class="player-list">
					<li v-for="player in team.players" :key="player.name" :class="{'is-online': player.online}">
						<span class="player-state" aria-hidden="true"></span>
						<span>{{ player.name }}</span>
						<small>{{ player.online ? (locale === 'en' ? 'ONLINE' : '在线') : (locale === 'en' ? 'OFFLINE' : '离线') }}</small>
					</li>
				</ul>
				<p v-else class="empty-roster">{{ locale === 'en' ? 'No members assigned' : '暂无阵营成员' }}</p>
				<div v-if="team.eliminated" class="eliminated-mark">{{ locale === 'en' ? 'ELIMINATED' : '已出局' }}</div>
			</article>
		</div>
	</section>
</template>

<style scoped>
.live-status { position: relative; z-index: 1; max-width: 1680px; margin: 0 auto; }
.live-toolbar { min-height: 84px; padding: 1rem 1.3rem; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: 1rem; border: 1px solid #343638; border-bottom: 0; background: #111518; }
.live-state, .countdown { display: flex; align-items: center; gap: .8rem; }
.live-state strong, .live-state small, .countdown small { display: block; font: 700 .68rem/1.5 'Space Mono', monospace; letter-spacing: .13em; }
.live-state strong { color: #79d49c; }.live-state small, .countdown small { color: #858987; }
.live-dot { width: 10px; height: 10px; border-radius: 50%; background: #5fd18b; box-shadow: 0 0 0 6px rgba(95,209,139,.11), 0 0 24px rgba(95,209,139,.7); animation: live-pulse 1.6s ease-in-out infinite; }
.live-dot.is-stale { background: #e7a052; box-shadow: 0 0 0 6px rgba(231,160,82,.11); animation: none; }
.countdown { text-align: right; }.countdown strong { min-width: 11ch; color: #f0eee8; font: 500 clamp(1.2rem, 3vw, 2rem)/1 'Space Mono', monospace; letter-spacing: .04em; }
.stale-notice { margin: 0; padding: .8rem 1.3rem; border: 1px solid #6e4b26; background: #241a10; color: #e7ad70; font-size: .85rem; }
.live-team-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; background: #343638; border: 1px solid #343638; }
.live-team { position: relative; min-width: 0; padding: clamp(1.2rem, 2.5vw, 2rem); background: #111518; border-top: 4px solid var(--team-accent); overflow: hidden; }
.live-team::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 100% 0, color-mix(in srgb, var(--team-accent) 14%, transparent), transparent 42%); pointer-events: none; }
.team-heading { position: relative; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; min-height: 120px; }
.team-id { color: var(--team-accent); font: 700 .7rem/1.4 'Space Mono', monospace; letter-spacing: .14em; }
.team-heading h2 { margin: .45rem 0 .35rem; font-size: clamp(1.45rem, 2.4vw, 2.3rem); font-weight: 560; }.team-heading p { margin: 0; color: #8f9290; font-size: .84rem; }
.team-score { flex: none; text-align: right; }.team-score strong { display: block; color: var(--team-accent); font: 500 clamp(2.5rem, 5vw, 4.8rem)/.9 'Space Mono', monospace; letter-spacing: -.08em; }.team-score small { color: #7f8381; font: 700 .68rem 'Space Mono', monospace; letter-spacing: .14em; }
.roster-heading { position: relative; display: flex; justify-content: space-between; gap: 1rem; margin: 1.2rem 0 .65rem; padding-top: 1rem; border-top: 1px solid #303438; color: #8f9290; font: 700 .65rem/1.4 'Space Mono', monospace; letter-spacing: .1em; }
.player-list { position: relative; margin: 0; padding: 0; list-style: none; display: grid; gap: 2px; }.player-list li { min-height: 42px; padding: 0 .7rem; display: grid; grid-template-columns: 8px 1fr auto; align-items: center; gap: .65rem; background: #171b1e; color: #858886; }.player-list li.is-online { color: #efeee8; }.player-list small { color: #646866; font: 700 .58rem 'Space Mono', monospace; letter-spacing: .08em; }.player-list .is-online small { color: #6fbc8b; }
.player-state { width: 6px; height: 6px; border-radius: 50%; background: #535755; }.is-online .player-state { background: #5fd18b; box-shadow: 0 0 8px rgba(95,209,139,.65); }
.empty-roster { position: relative; margin: 0; padding: 1.1rem .7rem; background: #171b1e; color: #6f7371; font-size: .85rem; }
.live-team.is-eliminated { filter: saturate(.25); }.eliminated-mark { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(6,8,9,.62); color: #e1725a; font: 700 clamp(1.2rem, 3vw, 2.1rem) 'Space Mono', monospace; letter-spacing: .18em; transform: rotate(-8deg); pointer-events: none; }
@keyframes live-pulse { 50% { opacity: .55; transform: scale(.82); } }
@media (max-width: 1050px) { .live-team-grid { grid-template-columns: 1fr; }.team-heading { min-height: 0; } }
@media (max-width: 580px) { .live-toolbar { align-items: flex-start; }.live-state { align-items: flex-start; }.countdown { display: block; }.countdown strong { margin-top: .3rem; font-size: 1.05rem; }.team-heading { gap: .5rem; }.team-score strong { font-size: 2.6rem; }.roster-heading { font-size: .58rem; } }
@media (prefers-reduced-motion: reduce) { .live-dot { animation: none; } }
</style>
