<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useUiPreferences } from '@/composables/useUiPreferences.js'

interface Advancement {
	id: number;
	name: string;
	description: string;
}

defineProps<{
	advancement: Advancement;
	status?: "completed" | "pending";
}>();

const { t } = useI18n()
const { isModernUi } = useUiPreferences()
</script>

<template>
	<article class="card advancement-card" :class="status">
		<div class="card-status">
			<span v-if="isModernUi" class="material-symbols-rounded" aria-hidden="true">{{ status === "completed" ? "check_circle" : "schedule" }}</span>
			<span>{{ status === "completed" ? t('advancementPage.completed') : t('advancementPage.pending') }}</span>
		</div>
		<div class="card-copy">
			<h2>{{ advancement.name }}</h2>
			<p>{{ advancement.description }}</p>
		</div>
	</article>
</template>

<style scoped>
.card {
	display: grid;
	grid-template-columns: auto minmax(0, 1fr);
	align-items: start;
	gap: 0.85rem;
	border: 1px solid var(--border-soft, var(--split));
	background: var(--glass-strong, var(--background));
	padding: 0.95rem;
	min-width: 0;
	transition:
		border-color 0.18s var(--ease-out),
		background-color 0.18s var(--ease-out);
}

.card.completed {
	border-color: color-mix(in srgb, var(--success) 42%, var(--border-soft, var(--split)));
	background: color-mix(in srgb, var(--success) 8%, var(--glass-strong, var(--background)));
}

.card.pending {
	background: var(--surface-soft, transparent);
}

.card:hover {
	border-color: var(--primary);
}

.card-status {
	border: 1px solid currentColor;
	color: var(--text-secondary);
	padding: 0.24rem 0.42rem;
	font-size: 0.75rem;
	font-weight: 700;
	line-height: 1;
	white-space: nowrap;
}

.completed .card-status {
	color: var(--success-text);
}

.card-copy {
	min-width: 0;
}

h2 {
	font-size: clamp(1rem, 1.5vw, 1.18rem);
	line-height: 1.25;
	margin: 0;
	color: var(--title-color);
	overflow-wrap: anywhere;
}

p {
	font-size: 0.92rem;
	line-height: 1.5;
	margin: 0.42rem 0 0;
	color: var(--text-secondary);
	overflow-wrap: anywhere;
}

.completed p {
	color: var(--text-main);
}

@media (max-width: 520px) {
	.card {
		grid-template-columns: 1fr;
		gap: 0.65rem;
		padding: 0.85rem;
	}

	.card-status {
		width: fit-content;
	}
}

:global(:root[data-ui="modern"] .advancement-card) {
	border-radius: var(--md-sys-shape-corner-large);
	border-color: color-mix(in srgb, var(--md-sys-color-outline-variant) 50%, transparent);
	background: var(--md-sys-color-surface-container-low);
	box-shadow: var(--md-sys-elevation-level1);
	transition:
		border-color var(--motion-base) var(--md-sys-motion-easing-standard),
		background-color var(--motion-base) var(--md-sys-motion-easing-standard);
}

:global(:root[data-ui="modern"] .advancement-card:hover) {
	border-color: color-mix(in srgb, var(--md-sys-color-primary) 50%, transparent);
}

:global(:root[data-ui="modern"] .advancement-card.completed) {
	border-color: color-mix(in srgb, var(--md-sys-color-success) 32%, transparent);
	background: color-mix(in srgb, var(--md-sys-color-success-container) 45%, var(--md-sys-color-surface-container-low));
}

:global(:root[data-ui="modern"] .advancement-card.completed h2) {
	color: var(--md-sys-color-on-surface);
}

:global(:root[data-ui="modern"] .advancement-card.completed p) {
	color: var(--md-sys-color-on-surface-variant);
}

:global(:root[data-ui="modern"] .advancement-card.pending) {
	background: var(--md-sys-color-surface-container-low);
}

:global(:root[data-ui="modern"] .advancement-card .card-status) {
	display: inline-flex;
	align-items: center;
	gap: 0.3rem;
	border: none;
	border-radius: var(--md-sys-shape-corner-full);
	background: var(--md-sys-color-surface-container-high);
	color: var(--md-sys-color-on-surface-variant);
	padding: 0.32rem 0.68rem;
}

:global(:root[data-ui="modern"] .advancement-card .card-status .material-symbols-rounded) {
	font-size: 0.95rem;
}

:global(:root[data-ui="modern"] .advancement-card.completed .card-status) {
	background: var(--md-sys-color-success-container);
	color: var(--md-sys-color-on-success-container);
}
</style>
