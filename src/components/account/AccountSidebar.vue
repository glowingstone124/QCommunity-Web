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

const emit = defineEmits(['select', 'logout'])
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
			<button type="button" class="logout-button" @click="emit('logout')">
				<span class="logout-title">注销登录</span>
				<span class="logout-desc">清除当前设备上的账户会话</span>
			</button>

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
	top: 1rem;
	align-self: start;
	display: flex;
	flex-direction: column;
	gap: 1rem;
	font-family: 'GSans', 'Inter', sans-serif;
	min-height: calc(100dvh - var(--app-header-height) - 4rem);
	border: none;
	background: transparent;
	border-radius: 0;
	padding: 0;
}

.side-header h1 {
	margin: 0.35rem 0 0.25rem;
	font-size: 1.7rem;
	line-height: 1.1;
	color: var(--title-color);
}

.eyebrow {
	text-transform: uppercase;
	letter-spacing: 0;
	font-size: 0.75rem;
	color: var(--text-secondary);
	margin: 0;
	font-weight: 700;
}

.side-sub {
	margin: 0;
	color: var(--text-secondary);
	line-height: 1.5;
	font-size: 0.92rem;
}

.nav {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	border-top: 1px solid var(--border-soft);
	border-bottom: 1px solid var(--border-soft);
	padding: 0.25rem 0;
}

.nav-item {
	border: none;
	background: transparent;
	border-radius: 0;
	padding: 0.88rem 0;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.25rem;
	text-align: left;
	position: relative;
	color: var(--text-main);
	cursor: pointer;
	transition:
		background-color 0.18s ease,
		color 0.18s ease,
		padding 0.18s ease;
}

.nav-item::after {
	content: '';
	position: absolute;
	left: 0;
	top: 0;
	bottom: 0;
	width: 2px;
	background: var(--text-main);
	transform: scaleY(0);
	transform-origin: center;
	transition: transform 0.18s ease;
}

.nav-item:hover,
.nav-item.active {
	padding-left: 0.75rem;
	background: var(--text-main);
	color: var(--background);
}

.nav-item.active {
	font-weight: 700;
}

.nav-item:hover::after,
.nav-item.active::after {
	transform: scaleY(1);
}

.nav-title {
	font-size: 1rem;
	font-weight: 600;
	color: currentColor;
}

.nav-desc {
	color: currentColor;
	font-size: 0.9rem;
	opacity: 0.68;
}

.side-foot {
	margin-top: auto;
	display: flex;
	flex-direction: column;
	gap: 0.9rem;
}

.logout-button {
	width: 100%;
	border: 1px solid color-mix(in srgb, var(--error) 55%, transparent);
	background: transparent;
	border-radius: 0;
	padding: 0.82rem 0.9rem;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.25rem;
	text-align: left;
	cursor: pointer;
	color:white;
	transition:
		background-color 0.2s ease,
		border-color 0.2s ease;
}

.logout-button:hover {
	background: var(--error);
	border-color: var(--error);
	color: white;
}

.logout-title {
	font-size: 1rem;
	font-weight: 700;
	color: currentColor;
}

.logout-desc {
	color: currentColor;
	font-size: 0.88rem;
	opacity: 0.68;
}

.tip-card {
	background: transparent;
	padding: 0.9rem;
	border-radius: 0;
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
		min-height: auto;
	}

	.nav {
		flex-direction: row;
		flex-wrap: wrap;
		border: none;
		padding: 0;
	}

	.nav-item {
		flex: 1 1 160px;
		border: 1px solid var(--border-soft);
		padding: 0.82rem 0.9rem;
	}
}

@media (max-width: 640px) {
	.nav-item {
		flex: 1 1 100%;
	}
}
</style>
