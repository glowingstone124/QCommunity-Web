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
})

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
	border-radius: 26px;
	padding: 2.4rem;
	box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
	border: 1px solid var(--border-soft);
	display: flex;
	flex-direction: column;
	gap: 2rem;
	min-height: 65vh;
}

.panel-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 1rem;
}

.panel-title {
	font-size: 2rem;
	margin: 0;
	color: var(--title-color);
}

.panel-sub {
	margin: 0.25rem 0 0;
	color: var(--text-secondary);
}

.pill {
	padding: 0.35rem 0.9rem;
	border-radius: 999px;
	background: rgba(37, 99, 235, 0.12);
	color: var(--text-main);
	font-size: 0.9rem;
}

.stats {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
	gap: 1rem;
}

.stat-card {
	background: var(--glass-soft);
	border-radius: 18px;
	padding: 1rem 1.2rem;
	border: 1px solid var(--border-soft);
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
}

.stat-label {
	margin: 0;
	color: var(--text-secondary);
	font-size: 0.9rem;
}

.stat-value {
	margin: 0;
	font-size: 1.4rem;
	color: var(--text-main);
	font-weight: 600;
}

.status-ok {
	color: var(--success);
}

.status-frozen {
	color: var(--error);
}

.stat-num {
	font-size: 1.6rem;
}

.section {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.section-title {
	font-size: 1.2rem;
	font-weight: 600;
	color: var(--title-color);
}

.record-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
}

.login-record {
	border-radius: 18px;
	background: var(--surface-soft);
	padding: 1rem 1.2rem;
	border: 1px solid transparent;
}

.login-record.success {
	border-color: rgba(22, 163, 74, 0.35);
}

.login-record.fail {
	border-color: rgba(220, 38, 38, 0.35);
}

.login-record h2 {
	margin: 0 0 0.35rem;
	font-size: 1.6rem;
	color: var(--text-main);
}

.login-record p,
.empty {
	margin: 0;
	color: var(--text-secondary);
	font-size: 0.95rem;
}

@media (max-width: 960px) {
	.panel {
		padding: 1.6rem;
		min-height: unset;
	}

	.panel-header {
		flex-direction: column;
		align-items: flex-start;
	}
}

@media (max-width: 640px) {
	.panel-title {
		font-size: 1.6rem;
	}

	.stats,
	.record-grid {
		grid-template-columns: 1fr;
	}
}
</style>
