<script setup>
defineProps({
	currentSetting: {
		type: Number,
		required: true,
	},
	tabs: {
		type: Array,
		default: () => [],
	},
})

const emit = defineEmits(['select'])
</script>

<template>
	<aside class="side">
		<div class="side-header">
			<p class="eyebrow">Account</p>
			<h1>账户中心</h1>
			<p class="side-sub">集中管理账户、登录安全与个性化配置</p>
		</div>
		<nav class="nav">
			<button
				v-for="tab in tabs"
				:key="tab.id"
				type="button"
				class="nav-item"
				:class="{ active: currentSetting === tab.id }"
				@click="emit('select', tab.id)"
			>
				<span class="nav-title">{{ tab.title }}</span>
				<span class="nav-desc">{{ tab.description }}</span>
			</button>
		</nav>
		<div class="side-foot">
			<div class="tip-card">
				<p class="tip-title">安全提示</p>
				<p class="tip-desc">建议定期查看登录历史，发现异常立即修改密码。</p>
			</div>
		</div>
	</aside>
</template>

<style scoped>
.side {
	position: sticky;
	top: 1.5rem;
	align-self: start;
	display: flex;
	flex-direction: column;
	gap: 2rem;
	font-family: 'GSans', 'Inter', sans-serif;
}

.side-header h1 {
	margin: 0.5rem 0 0.2rem;
	font-size: 2.6rem;
	color: var(--title-color);
}

.eyebrow {
	text-transform: uppercase;
	letter-spacing: 0.35rem;
	font-size: 0.75rem;
	color: var(--text-secondary);
	margin: 0;
}

.side-sub {
	margin: 0;
	color: var(--text-secondary);
	line-height: 1.6;
}

.nav {
	display: flex;
	flex-direction: column;
	gap: 0.8rem;
}

.nav-item {
	border: 1px solid transparent;
	background: var(--nav-bg);
	border-radius: 18px;
	padding: 1rem 1.2rem;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.25rem;
	text-align: left;
	transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.nav-item:hover {
	cursor: pointer;
	transform: translateY(-2px);
	box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

.nav-item.active {
	border-color: rgba(37, 99, 235, 0.45);
	background: rgba(37, 99, 235, 0.16);
}

.nav-title {
	font-size: 1.1rem;
	font-weight: 600;
	color: var(--text-main);
}

.nav-desc {
	color: var(--text-secondary);
	font-size: 0.9rem;
}

.side-foot {
	margin-top: auto;
}

.tip-card {
	background: var(--surface-soft);
	padding: 1.2rem;
	border-radius: 18px;
	border: 1px solid var(--border-soft);
}

.tip-title {
	margin: 0 0 0.35rem;
	font-weight: 600;
	color: var(--text-main);
}

.tip-desc {
	margin: 0;
	color: var(--text-secondary);
	line-height: 1.5;
}

@media (max-width: 960px) {
	.side {
		position: static;
	}

	.nav {
		flex-direction: row;
		flex-wrap: wrap;
	}

	.nav-item {
		flex: 1 1 160px;
	}
}

@media (max-width: 640px) {
	.nav-item {
		flex: 1 1 100%;
	}
}
</style>
