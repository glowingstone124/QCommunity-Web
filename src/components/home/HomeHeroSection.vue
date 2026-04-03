<script setup>
defineProps({
	stats: {
		type: Array,
		default: () => [],
	},
})
</script>

<template>
	<section class="hero">
		<div class="hero-copy">
			<p class="eyebrow">Quantum Original</p>
			<h1 class="hero-title">欢迎回来</h1>
			<p class="hero-sub">集中管理账号、功能与服务入口。选择模块即可开始。</p>
			<div class="hero-actions">
				<router-link to="/register" class="action primary">
					{{ $t('mainPage.register') }}
				</router-link>
				<router-link to="/query" class="action ghost">
					{{ $t('mainPage.query') }}
				</router-link>
			</div>
		</div>
		<div class="hero-card">
			<div v-for="item in stats" :key="item.label" class="stat">
				<p class="stat-label">{{ item.label }}</p>
				<p class="stat-value">{{ $t(item.valueKey) }}</p>
			</div>
		</div>
	</section>
</template>

<style scoped>
.hero {
	display: grid;
	grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.85fr);
	gap: 1.5rem;
	align-items: stretch;
}

.hero-copy,
.hero-card {
	border-radius: 28px;
	border: 1px solid var(--split);
	background: var(--card-background);
	box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
}

.hero-copy {
	padding: clamp(1.6rem, 3vw, 2.4rem);
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 1rem;
}

.eyebrow {
	text-transform: uppercase;
	letter-spacing: 0.35rem;
	font-size: 0.75rem;
	color: var(--text-secondary);
	margin: 0;
}

.hero-title {
	margin: 0;
	font-size: clamp(2.6rem, 7vw, 4.2rem);
	font-weight: 600;
	color: var(--title-color);
	font-family: 'Bahnschrift', 'Inter', sans-serif;
}

.hero-sub {
	margin: 0;
	color: var(--text-secondary);
	font-size: 1.05rem;
	line-height: 1.7;
	max-width: 36rem;
}

.hero-actions {
	display: flex;
	gap: 0.85rem;
	flex-wrap: wrap;
}

.action {
	text-decoration: none;
	padding: 0.85rem 1.6rem;
	border-radius: 999px;
	font-weight: 600;
	border: 1px solid transparent;
}

.action.primary {
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
}

.action.primary:hover {
	background: var(--button-primary-hover);
}

.action.ghost {
	background: transparent;
	color: var(--text-main);
	border-color: var(--split);
}

.action.ghost:hover {
	background: var(--button-secondary-hover);
}

.hero-card {
	padding: 1.4rem;
	display: grid;
	gap: 0.9rem;
}

.stat {
	padding: 1rem 1.1rem;
	border-radius: 18px;
	background: var(--background-secondary);
}

.stat-label {
	margin: 0 0 0.35rem;
	font-size: 0.9rem;
	color: var(--text-secondary);
}

.stat-value {
	margin: 0;
	font-size: 1.2rem;
	font-weight: 600;
	color: var(--text-main);
}

@media (max-width: 900px) {
	.hero {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 640px) {
	.hero-copy,
	.hero-card {
		border-radius: 22px;
	}
}
</style>
