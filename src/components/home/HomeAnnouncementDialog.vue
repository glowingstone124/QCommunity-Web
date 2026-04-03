<script setup>
defineProps({
	modelValue: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits(['close', 'visit'])
</script>

<template>
	<dialog :open="modelValue" class="custom-dialog">
		<div class="dialog-content">
			<h2>Quantum Original 2 新官网现已上线！</h2>
			<div class="dialog-actions">
				<button type="button" class="close-btn" @click="emit('visit')">带我去！</button>
				<button type="button" class="close-btn close-btn--ghost" @click="emit('close')">我知道了</button>
			</div>
		</div>
	</dialog>
</template>

<style scoped>
.custom-dialog {
	border: none;
	border-radius: 18px;
	padding: 2rem;
	background: var(--card-background);
	color: var(--text-main);
	box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
	width: min(560px, calc(100vw - 2rem));
}

.custom-dialog::backdrop {
	background: rgba(15, 23, 42, 0.32);
	backdrop-filter: blur(4px);
}

.dialog-content {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	text-align: center;
}

.dialog-content h2 {
	font-size: clamp(1.4rem, 3vw, 2rem);
	margin: 0;
	color: var(--title-color);
}

.dialog-actions {
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	gap: 0.75rem;
}

.close-btn {
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
	border: none;
	padding: 0.8rem 1.4rem;
	border-radius: 999px;
	cursor: pointer;
}

.close-btn--ghost {
	background: var(--button-secondary-bg);
	color: var(--button-secondary-text);
	border: 1px solid var(--button-secondary-border);
}
</style>
