<script setup>
import { computed, ref } from 'vue'
import debounce from 'lodash/debounce'
import PlayerInfoCard from '@/components/PlayerCard.vue'

const inputId = ref('')
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
	errorMessage.value = ''
}

async function getAvatar(name) {
	try {
		const response = await fetch(`https://api.glowingstone.cn/qo/download/avatar?name=${encodeURIComponent(name)}`)
		const data = await response.json()
		avatarUrl.value = data.url || avatarUrl.value
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
		await getAvatar(id)
	} catch (error) {
		console.error('Error fetching query:', error)
		errorMessage.value = '查询失败，请稍后重试。'
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
					<h1>玩家查询</h1>
					<p>输入玩家 ID，查看账户状态、在线情况、累计游玩时间与卡面信息。</p>
				</div>

				<form class="search-form" @submit.prevent="submitSearch">
					<label class="search-field">
						<span>玩家 ID</span>
						<input
							v-model="inputId"
							type="text"
							placeholder="例如：glowingstone124"
							autocomplete="off"
							@input="handleSearch"
						/>
					</label>
					<button type="submit" class="search-btn" :disabled="!canSearch">
						{{ loading ? '查询中' : '查询' }}
					</button>
				</form>
			</div>

			<section class="result-panel">
				<div v-if="!searched" class="empty-state">
					<h2>等待查询</h2>
					<p>输入一个玩家 ID 后，结果会显示在这里。</p>
				</div>

				<div v-else-if="loading" class="empty-state">
					<h2>正在查询</h2>
					<p>正在拉取玩家注册信息。</p>
				</div>

				<div v-else-if="errorMessage" class="empty-state error">
					<h2>查询失败</h2>
					<p>{{ errorMessage }}</p>
				</div>

				<div v-else-if="!found" class="empty-state">
					<h2>未找到玩家</h2>
					<p>没有查询到 “{{ queryId }}” 的注册信息。</p>
				</div>

				<div v-else-if="affiliated" class="affiliated-result">
					<div class="result-heading">
						<span class="result-label">附属账户</span>
						<h2>{{ queryId }}</h2>
						<p>该账户绑定到主账户 {{ host || '未知' }}。</p>
					</div>
					<div class="affiliated-row">
						<span>主账户</span>
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
				/>
			</section>
		</section>
	</main>
</template>

<style scoped>
.query-page {
	height: 100%;
	min-height: 0;
	overflow: auto;
	background: var(--background-secondary);
	padding: 1rem;
}

.query-shell {
	width: min(1280px, 100%);
	min-height: 100%;
	margin: 0 auto;
	display: grid;
	grid-template-columns: minmax(280px, 420px) minmax(0, 1fr);
	gap: 1rem;
	align-items: stretch;
}

.query-panel,
.result-panel {
	background: var(--background);
	border: 1px solid var(--split);
	border-radius: 8px;
	padding: 1.2rem;
	box-sizing: border-box;
}

.query-panel {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
}

.panel-heading h1 {
	margin: 0 0 0.45rem;
	color: var(--title-color);
	font-size: 1.7rem;
	line-height: 1.2;
}

.panel-heading p {
	margin: 0;
	color: var(--text-secondary);
	line-height: 1.55;
}

.search-form {
	display: grid;
	gap: 0.75rem;
}

.search-field {
	display: grid;
	gap: 0.45rem;
}

.search-field span {
	color: var(--text-secondary);
	font-size: 0.9rem;
}

.search-field input {
	width: 100%;
	box-sizing: border-box;
	border: 1px solid var(--split);
	background: transparent;
	color: var(--text-main);
	border-radius: 6px;
	padding: 0.85rem 0.9rem;
	font-size: 1rem;
	outline: none;
}

.search-field input:focus {
	border-color: var(--primary);
	box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 14%, transparent);
}

.search-btn {
	border: 1px solid var(--primary);
	border-radius: 6px;
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
	padding: 0.85rem 1rem;
	font-weight: 700;
	cursor: pointer;
}

.search-btn:hover:not(:disabled) {
	background: var(--button-primary-hover);
}

.search-btn:disabled {
	cursor: not-allowed;
	opacity: 0.56;
}

.helper-grid {
	display: grid;
	gap: 0.55rem;
	margin-top: auto;
}

.helper-item {
	border: 1px solid var(--split);
	border-radius: 6px;
	padding: 0.75rem 0.85rem;
	display: grid;
	gap: 0.2rem;
}

.helper-item strong {
	color: var(--text-main);
	font-size: 0.95rem;
}

.helper-item span {
	color: var(--text-secondary);
	font-size: 0.86rem;
	line-height: 1.45;
}

.result-panel {
	min-width: 0;
	min-height: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: auto;
}

.result-panel :deep(.player-info) {
	width: min(100%, 820px);
	margin: 0;
}

.empty-state,
.affiliated-result {
	width: min(520px, 100%);
	border: 1px solid var(--split);
	border-radius: 8px;
	padding: 1.25rem;
	box-sizing: border-box;
}

.empty-state h2,
.result-heading h2 {
	margin: 0 0 0.45rem;
	color: var(--title-color);
	font-size: 1.25rem;
}

.empty-state p,
.result-heading p {
	margin: 0;
	color: var(--text-secondary);
	line-height: 1.55;
}

.empty-state.error h2 {
	color: var(--error);
}

.affiliated-result {
	display: grid;
	gap: 1rem;
}

.result-label {
	width: fit-content;
	border: 1px solid var(--primary);
	border-radius: 4px;
	color: var(--primary);
	padding: 0.18rem 0.45rem;
	font-size: 0.78rem;
	font-weight: 700;
}

.affiliated-row {
	display: flex;
	justify-content: space-between;
	gap: 1rem;
	border-top: 1px solid var(--split);
	padding-top: 1rem;
	color: var(--text-secondary);
}

.affiliated-row strong {
	color: var(--text-main);
	word-break: break-word;
}

@media (max-width: 900px) {
	.query-shell {
		grid-template-columns: 1fr;
		min-height: auto;
	}

	.result-panel {
		min-height: 420px;
	}
}

@media (max-width: 640px) {
	.query-page {
		padding: 0.75rem;
	}

	.query-panel,
	.result-panel {
		padding: 1rem;
	}

	.result-panel {
		align-items: stretch;
		min-height: 0;
	}
}
</style>
