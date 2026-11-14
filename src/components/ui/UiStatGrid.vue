<script setup>
defineProps({
	columns: {
		type: [String, Number],
		default: 'auto',
	},
})
</script>

<template>
	<section
		class="ui-stat-grid"
		:class="`ui-stat-grid--cols-${columns}`"
	>
		<slot />
	</section>
</template>

<style scoped>
.ui-stat-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr));
	gap: 0.9rem;
}

.ui-stat-grid--cols-2 {
	grid-template-columns: repeat(2, minmax(0, 1fr));
}

.ui-stat-grid--cols-3 {
	grid-template-columns: repeat(3, minmax(0, 1fr));
}

.ui-stat-grid--cols-4 {
	grid-template-columns: repeat(4, minmax(0, 1fr));
}

@media (max-width: 780px) {
	.ui-stat-grid--cols-3,
	.ui-stat-grid--cols-4 {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

@media (max-width: 520px) {
	.ui-stat-grid--cols-2,
	.ui-stat-grid--cols-3,
	.ui-stat-grid--cols-4 {
		grid-template-columns: 1fr;
	}
}
</style>
