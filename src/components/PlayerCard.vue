<script setup lang="ts">
import { computed } from 'vue'
import ArtCardForQueryUsage from '@/components/ArtCardForQueryUsage.vue'

interface Props {
	username: string
	avatar?: string
	banned: boolean
	online: boolean
	qq?: string
	found?: boolean
	playtime?: number
}

const props = defineProps<Props>()

const statusText = computed(() => {
	if (props.banned) return '已冻结'
	return props.online ? '在线' : '离线'
})

const statusClass = computed(() => ({
	'status-banned': props.banned,
	'status-online': !props.banned && props.online,
	'status-offline': !props.banned && !props.online,
}))

const playtimeText = computed(() => {
	const minutes = Number(props.playtime || 0)
	if (minutes <= 0) return '暂无记录'
	if (minutes < 60) return `${minutes} 分钟`
	const hours = Math.floor(minutes / 60)
	const rest = minutes % 60
	return rest ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`
})

const infoItems = computed(() => [
	{ label: '玩家 ID', value: props.username || '未知' },
	{ label: 'UID', value: props.qq || '未公开' },
	{ label: '累计游玩', value: playtimeText.value },
	{ label: '账户状态', value: props.banned ? '已冻结' : '正常' },
])
</script>

<template>
	<article class="player-info">
		<header class="profile-header">
			<img
				:src="avatar"
				alt="玩家头像"
				class="avatar"
				crossorigin="anonymous"
			/>
			<div class="profile-title">
				<span class="eyebrow">查询结果</span>
				<h2>{{ username }}</h2>
				<span class="status-pill" :class="statusClass">{{ statusText }}</span>
			</div>
		</header>

		<section class="content-grid">
			<div class="preview-panel">
				<div class="preview-frame">
					<ArtCardForQueryUsage :scale="0.42" :username="username" />
				</div>
			</div>

			<div class="detail-panel">
				<div class="section-heading">
					<h3>玩家信息</h3>
					<p>注册资料与服务器状态</p>
				</div>

				<div class="info-grid">
					<div v-for="item in infoItems" :key="item.label" class="info-item">
						<span>{{ item.label }}</span>
						<strong>{{ item.value }}</strong>
					</div>
				</div>
			</div>
		</section>
	</article>
</template>

<style scoped>
.player-info {
	width: 100%;
	display: grid;
	gap: 1rem;
	color: var(--text-main);
	border: 1px solid var(--split);
	border-radius: 8px;
	background: var(--background);
	padding: 1rem;
	box-sizing: border-box;
}

.profile-header {
	display: flex;
	align-items: center;
	gap: 0.95rem;
	border-bottom: 1px solid var(--split);
	padding-bottom: 1rem;
	min-width: 0;
}

.avatar {
	width: 64px;
	height: 64px;
	border-radius: 8px;
	border: 1px solid var(--split);
	background: var(--background-secondary);
	object-fit: cover;
	flex: 0 0 auto;
}

.profile-title {
	min-width: 0;
	display: grid;
	gap: 0.28rem;
}

.eyebrow {
	color: var(--text-secondary);
	font-size: 0.82rem;
	font-weight: 700;
}

.profile-title h2 {
	margin: 0;
	color: var(--title-color);
	font-size: clamp(1.4rem, 2vw, 2rem);
	line-height: 1.15;
	overflow-wrap: anywhere;
}

.status-pill {
	width: fit-content;
	border: 1px solid var(--split);
	border-radius: 999px;
	padding: 0.25rem 0.58rem;
	font-size: 0.8rem;
	font-weight: 800;
	line-height: 1;
}

.status-online {
	border-color: color-mix(in srgb, var(--success) 54%, var(--split));
	color: var(--success);
}

.status-banned {
	border-color: color-mix(in srgb, var(--error) 58%, var(--split));
	color: var(--error);
}

.status-offline {
	color: var(--text-secondary);
}

.content-grid {
	display: grid;
	grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
	gap: 1rem;
	align-items: stretch;
}

.preview-panel,
.detail-panel {
	border: 1px solid var(--split);
	border-radius: 8px;
	background: var(--background);
	min-width: 0;
}

.preview-panel {
	display: flex;
	justify-content: center;
	align-items: flex-start;
	padding: 1rem;
	overflow: hidden;
}

.preview-frame {
	width: 294px;
	height: 420px;
	max-width: 100%;
	overflow: hidden;
	border-radius: 6px;
	background: var(--background-secondary);
}

.detail-panel {
	padding: 1rem;
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.section-heading h3 {
	margin: 0 0 0.28rem;
	color: var(--title-color);
	font-size: 1.05rem;
	line-height: 1.2;
}

.section-heading p {
	margin: 0;
	color: var(--text-secondary);
	font-size: 0.9rem;
	line-height: 1.45;
}

.info-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.65rem;
}

.info-item {
	border: 1px solid var(--split);
	border-radius: 6px;
	padding: 0.78rem 0.85rem;
	display: grid;
	gap: 0.22rem;
	min-width: 0;
}

.info-item span {
	color: var(--text-secondary);
	font-size: 0.8rem;
}

.info-item strong {
	color: var(--text-main);
	font-size: 0.98rem;
	line-height: 1.35;
	overflow-wrap: anywhere;
}

@media (max-width: 760px) {
	.content-grid {
		grid-template-columns: 1fr;
	}

	.preview-frame {
		width: 252px;
		height: 360px;
	}

	.preview-frame :deep(.wrapper) {
		transform: scale(0.36) !important;
	}
}

@media (max-width: 520px) {
	.profile-header {
		align-items: flex-start;
	}

	.avatar {
		width: 56px;
		height: 56px;
	}

	.info-grid {
		grid-template-columns: 1fr;
	}
}
</style>
