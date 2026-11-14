<script setup lang="ts">
import { useI18n } from "vue-i18n";
import UiButton from "@/components/ui/UiButton.vue";

const { t } = useI18n();
</script>

<template>
	<div class="not-found">
		<h1>{{ t('notFoundPage.title') }}</h1>
		<p class="description">{{ t('notFoundPage.description') }}</p>
		<UiButton variant="tonal" size="lg" icon="arrow_back" to="/">
			{{ t('notFoundPage.home') }}
		</UiButton>
	</div>
</template>

<style scoped>
.not-found {
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: calc(100dvh - var(--app-header-height));
	flex-direction: column;
	text-align: center;
	padding: 2rem;
	background: var(--page-background, var(--background));
}

h1 { margin: 0; font-size: clamp(2.4rem, 8vw, 5.5rem); line-height: 1; }
.description { max-width: 34rem; margin: 1.25rem auto 1.75rem; color: var(--text-secondary); font-size: 1.05rem; }

.redirect {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	border: 1px solid var(--button-secondary-border);
	border-radius: 999px;
	padding: 0.7rem 1.1rem;
	background: var(--button-secondary-bg);
	color: var(--button-secondary-text);
	cursor: pointer;
	font-weight: 700;
	transition: transform var(--motion-fast) var(--ease-standard), background var(--motion-fast) var(--ease-out);
}

.redirect:hover { transform: translateY(-2px); background: var(--button-secondary-hover); }
.arrow { transition: transform var(--motion-fast) var(--ease-standard); }
.redirect:hover .arrow { transform: translateX(-3px); }

:global(:root[data-ui="modern"] .not-found) {
	background: var(--md-sys-color-surface);
}

:global(:root[data-ui="modern"] .not-found h1) {
	color: var(--md-sys-color-on-surface);
	text-wrap: balance;
}

:global(:root[data-ui="modern"] .not-found .description) {
	color: var(--md-sys-color-on-surface-variant);
	text-wrap: pretty;
}

:global(:root[data-ui="modern"] .not-found .redirect) {
	min-height: 48px;
	padding: 0.75rem 1.45rem;
	border: none;
	background: var(--md-sys-color-secondary-container);
	color: var(--md-sys-color-on-secondary-container);
}

:global(:root[data-ui="modern"] .not-found .redirect:hover) {
	transform: none;
	background: color-mix(in srgb, var(--md-sys-color-on-secondary-container) 8%, var(--md-sys-color-secondary-container));
}
</style>
