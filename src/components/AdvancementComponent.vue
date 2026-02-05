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
	<div class="card" :class="status">
		<h2>{{ advancement.name }}</h2>
		<p>{{ advancement.description }}</p>
	</div>
</template>

<style scoped>
h2 {
	font-size: 1.2rem;
	margin: 0 0 0.4rem;
	color: var(--title-color);
}
p {
	font-size: 0.98rem;
	margin: 0;
	color: var(--text-secondary);
}

.card {
	border-radius: var(--radius-md);
	padding: 1rem 1.2rem;
	border: 1px solid var(--split);
	background: var(--card-background);
	box-shadow: none;
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
}
.card:hover {
	box-shadow: var(--shadow-soft);
	transform: translateY(-2px);
}
.card.completed {
	border-color: transparent;
	background: linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(96, 165, 250, 0.18));
}
.card.pending {
	background: var(--background-secondary);
}
</style>
