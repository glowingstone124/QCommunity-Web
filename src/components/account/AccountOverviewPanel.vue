<script setup>
defineProps({
	isFrozen: {
		type: [Boolean, null],
		default: null,
	},
	logins: {
		type: Array,
		default: () => [],
	},
	playtime: {
		type: Number,
		default: 0,
	},
	statusHint: {
		type: String,
		default: '',
	},
	uid: {
		type: Number,
		default: 0,
	},
	username: {
		type: String,
		default: '',
	},
	fallenSelection: {
		type: Object,
		default: null,
	},
})

const teamNames = {
	A: 'A · 旧城同盟',
	B: 'B · 主城守望',
	C: 'C · 锡城联合',
}

function formatDate(timestamp) {
	const date = new Date(timestamp)
	return date.toLocaleString()
}
</script>

<template>
	<section class="panel">
		<header class="panel-header">
			<div>
				<h2 class="panel-title">账户信息</h2>
				<p class="panel-sub">近况、统计与安全信息一览</p>
			</div>
			<span class="pill">绑定 QQ · {{ uid || '—' }}</span>
		</header>
		<div class="stats">
			<div class="stat-card">
				<p class="stat-label">用户名</p>
				<p class="stat-value">{{ username || '—' }}</p>
			</div>
			<div class="stat-card">
				<p class="stat-label">累计游玩</p>
				<p class="stat-value"><span class="stat-num">{{ playtime }}</span> 分钟</p>
			</div>
			<div class="stat-card">
				<p class="stat-label">登录次数</p>
				<p class="stat-value">{{ logins.length }}</p>
			</div>
			<div class="stat-card">
				<p class="stat-label">账号状态</p>
				<p class="stat-value" :class="isFrozen ? 'status-frozen' : 'status-ok'">{{ statusHint || '检测中' }}</p>
			</div>
			<div class="stat-card faction-card">
				<p class="stat-label">{{ fallenSelection?.finalized ? '当前阵营' : '当前阵营（预计）' }}</p>
				<p class="stat-value faction-value">
					{{ fallenSelection ? teamNames[fallenSelection.team] : '尚未选择' }}
				</p>
				<small v-if="fallenSelection && !fallenSelection.finalized">7 月 29 日均衡分配后确定</small>
			</div>
		</div>
		<div class="section">
			<div class="section-title">登录历史</div>
			<div v-if="logins.length" class="record-grid">
				<div
					v-for="(login, index) in logins"
					:key="index"
					class="login-record"
					:class="{ success: login.success, fail: !login.success }"
				>
					<h2>{{ login.success ? '成功' : '失败' }}</h2>
					<p>{{ formatDate(login.date) }}</p>
				</div>
			</div>
			<p v-else class="empty">暂无登录记录。</p>
		</div>
	</section>
</template>

<style scoped>
.panel {
	background: var(--glass-strong);
	border-radius: 0;
	padding: 1.4rem;
	border: none;
	display: flex;
	flex-direction: column;
	gap: 1.35rem;
	min-height: 100%;
	max-width: 1120px;
	width: 100%;
	margin: 0 auto;
	box-sizing: border-box;
}

.panel-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 1rem;
	animation: overview-item-in 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.panel-title {
	font-size: 1.45rem;
	margin: 0;
	color: var(--title-color);
	line-height: 1.2;
}

.panel-sub {
	margin: 0.25rem 0 0;
	color: var(--text-secondary);
}

.pill {
	padding: 0.35rem 0.65rem;
	border-radius: 0;
	background: var(--surface-soft);
	border: 1px solid var(--border-soft);
	color: var(--text-main);
	font-size: 0.86rem;
	white-space: nowrap;
}

.stats {
	display: grid;
	grid-template-columns: repeat(5, minmax(0, 1fr));
	border: 1px solid var(--border-soft);
	border-radius: 0;
	overflow: hidden;
}

.stat-card {
	background: transparent;
	border-radius: 0;
	padding: 1rem;
	border: none;
	border-right: 1px solid var(--border-soft);
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
	opacity: 0;
	animation: overview-item-in 380ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.stat-card:nth-child(1) { animation-delay: 70ms; }
.stat-card:nth-child(2) { animation-delay: 110ms; }
.stat-card:nth-child(3) { animation-delay: 150ms; }
.stat-card:nth-child(4) { animation-delay: 190ms; }
.stat-card:nth-child(5) { animation-delay: 230ms; }

.stat-card:last-child {
	border-right: none;
}

.stat-label {
	margin: 0;
	color: var(--text-secondary);
	font-size: 0.9rem;
}

.stat-value {
	margin: 0;
	font-size: 1.18rem;
	color: var(--text-main);
	font-weight: 600;
	word-break: break-word;
}

.status-ok {
	color: var(--success);
}

.status-frozen {
	color: var(--error);
}

.faction-value {
	color: var(--primary);
}

.faction-card small {
	color: var(--text-secondary);
	font-size: 0.76rem;
	line-height: 1.35;
}

.stat-num {
	font-size: 1.35rem;
}

.section {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	border: 1px solid var(--border-soft);
	border-radius: 0;
	padding: 1rem;
	opacity: 0;
	animation: overview-item-in 440ms cubic-bezier(0.22, 1, 0.36, 1) 230ms forwards;
}

.section-title {
	font-size: 1rem;
	font-weight: 600;
	color: var(--title-color);
}

.record-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 0.65rem;
}

.login-record {
	border-radius: 0;
	background: var(--surface-soft);
	padding: 0.82rem 0.9rem;
	border: 1px solid var(--border-soft);
	animation: overview-record-in 360ms ease both;
}

.login-record:nth-child(2) { animation-delay: 45ms; }
.login-record:nth-child(3) { animation-delay: 90ms; }

.login-record.success {
	border-color: color-mix(in srgb, var(--success) 42%, var(--border-soft));
}

.login-record.fail {
	border-color: color-mix(in srgb, var(--error) 42%, var(--border-soft));
}

.login-record h2 {
	margin: 0 0 0.35rem;
	font-size: 1rem;
	color: var(--text-main);
}

.login-record p,
.empty {
	margin: 0;
	color: var(--text-secondary);
	font-size: 0.95rem;
}

@keyframes overview-item-in {
	from { opacity: 0; transform: translateY(12px); }
	to { opacity: 1; transform: translateY(0); }
}

@keyframes overview-record-in {
	from { opacity: 0; transform: translateX(-8px); }
	to { opacity: 1; transform: translateX(0); }
}

@media (max-width: 960px) {
	.panel {
		padding: 1rem;
		min-height: unset;
	}

	.panel-header {
		flex-direction: column;
		align-items: flex-start;
	}

	.stats {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.stat-card:nth-child(2) {
		border-right: none;
	}

	.stat-card:nth-child(4) {
		border-right: none;
	}

	.stat-card:not(:last-child) {
		border-bottom: 1px solid var(--border-soft);
	}
}

@media (max-width: 640px) {
	.panel-title {
		font-size: 1.35rem;
	}

	.stats,
	.record-grid {
		grid-template-columns: 1fr;
	}

	.stat-card {
		border-right: none;
		border-bottom: 1px solid var(--border-soft);
	}

	.stat-card:last-child {
		border-bottom: none;
	}
}

@media (prefers-reduced-motion: reduce) {
	.panel-header,
	.stat-card,
	.section,
	.login-record {
		opacity: 1;
		animation: none;
		transform: none;
	}
}
</style>
