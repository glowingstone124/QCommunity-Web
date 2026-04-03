<script setup>
defineProps({
	description: {
		type: String,
		required: true,
	},
	icon: {
		type: String,
		required: true,
	},
	title: {
		type: String,
		required: true,
	},
	to: {
		type: String,
		required: true,
	},
})
</script>

<template>
	<router-link :to="to" class="tile">
		<div class="tile-icon">{{ icon }}</div>
		<div>
			<h2>{{ title }}</h2>
			<p>{{ description }}</p>
		</div>
	</router-link>
</template>

<style scoped>
.tile {
	background: var(--card-background);
	border-radius: 22px;
	padding: 1.4rem;
	display: flex;
	gap: 1rem;
	align-items: flex-start;
	border: 1px solid var(--split);
	text-decoration: none;
	color: inherit;
	box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
	transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.tile:hover {
	transform: translateY(-4px);
	box-shadow: 0 18px 32px rgba(15, 23, 42, 0.12);
	border-color: var(--primary-light);
}

.tile-icon {
	width: 48px;
	height: 48px;
	border-radius: 16px;
	display: grid;
	place-items: center;
	background: color-mix(in srgb, var(--primary) 14%, transparent);
	color: var(--primary);
	font-size: 1.2rem;
	font-weight: 700;
	flex-shrink: 0;
}

.tile h2 {
	font-size: 1.35rem;
	margin: 0 0 0.35rem;
	color: var(--title-color);
}

.tile p {
	margin: 0;
	color: var(--text-secondary);
	line-height: 1.5;
}
</style>
