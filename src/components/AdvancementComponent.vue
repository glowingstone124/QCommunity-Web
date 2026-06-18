<script setup lang="ts">
interface Advancement {
	id: number;
	name: string;
	description: string;
}

defineProps<{
	advancement: Advancement;
	status?: "completed" | "pending";
}>();
</script>

<template>
	<article class="card" :class="status">
		<div class="card-status">{{ status === "completed" ? "已完成" : "未完成" }}</div>
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
		border-color 0.18s ease,
		background-color 0.18s ease;
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
	color: var(--success);
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
</style>
