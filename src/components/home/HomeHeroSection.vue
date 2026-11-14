<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
			<h1 class="hero-title">{{ t('homeWidgets.welcome') }}</h1>
			<p class="hero-sub">{{ t('homeWidgets.description') }}</p>
			<div class="hero-actions">
				<router-link to="/register" class="action primary">
					{{ $t('mainPage.register') }}
				</router-link>
				<router-link to="/query" class="action ghost">
					{{ $t('mainPage.query') }}
				</router-link>
			</div>
		</div>
	</section>
</template>

<style scoped>
.hero {
	display: grid;
	gap: 1.5rem;
	align-items: stretch;
}

.hero-copy {
	padding: clamp(1.6rem, 3vw, 2.4rem);
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 1rem;
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

/* Material Design 3 Home Hero */
:global(:root[data-ui="modern"] .home .hero-copy) {
	border-radius: var(--md-sys-shape-corner-extra-large);
	background: color-mix(in srgb, var(--md-sys-color-primary-container) 30%, var(--md-sys-color-surface-container-low));
	border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 40%, transparent);
	box-shadow: var(--md-sys-elevation-level1);
}

:global(:root[data-ui="modern"] .home .action) {
	border-radius: var(--md-sys-shape-corner-full);
	min-height: 44px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding-inline: 1.5rem;
}

:global(:root[data-ui="modern"] .home .action.ghost) {
	border-color: var(--md-sys-color-outline);
	background: var(--md-sys-color-surface-container-lowest);
	color: var(--md-sys-color-primary);
}

:global(:root[data-ui="modern"] .home .action.ghost:hover) {
	background: color-mix(in srgb, var(--md-sys-color-primary) 8%, var(--md-sys-color-surface-container-lowest));
}
</style>
