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
	font-size: 1.8rem;
	margin-bottom: 0;
}
p {
	font-size: 1.1rem;
	font-weight: 200;
}

.pending {
	h2{
		color: var(--text-secondary);
	}
	p{
		color: var(--text-secondary);
	}
}
.card {
	border-radius: 25px;
	padding: 12px 25px;
	margin: 8px 0;
	transition: 0.2s;
}
.card:hover {
	box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
.card.completed {
	background: var(--primary-light);
}
.card.pending {
	border: 2px solid var(--split);
	background: transparent;
}
</style>
