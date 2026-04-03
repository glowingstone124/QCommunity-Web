<script setup>
defineProps({
	dimensionOptions: {
		type: Array,
		default: () => [],
	},
	transportTypes: {
		type: Array,
		default: () => [],
	},
	bannedDims: {
		type: Array,
		default: () => [],
	},
	bannedTypes: {
		type: Array,
		default: () => [],
	},
	show: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits(['close', 'preset', 'toggle-dimension', 'toggle-transport'])

function closeOnOutsideClick(event) {
	if (event.target.classList.contains('options-popup-overlay')) {
		emit('close')
	}
}
</script>

<template>
	<div v-if="show" class="options-popup-overlay" @click="closeOnOutsideClick">
		<div class="options-popup">
			<div class="popup-header">
				<h2>查询选项</h2>
				<button class="close-button" @click="emit('close')">&times;</button>
			</div>

			<div class="popup-content">
				<div class="options-section">
					<h3>预设方案</h3>
					<div class="preset-buttons">
						<button class="preset-button" @click="emit('preset', 'all')">全部方案</button>
						<button class="preset-button" @click="emit('preset', 'rail')">纯铁路方案</button>
						<button class="preset-button" @click="emit('preset', 'overworld')">主世界方案</button>
					</div>
				</div>

				<div class="options-section">
					<h3>启用交通方式</h3>
					<div class="transport-checkboxes">
						<div v-for="type in transportTypes" :key="type.id" class="checkbox-item">
							<label class="checkbox-label">
								<input
									type="checkbox"
									:checked="!type.disabled"
									class="checkbox-input"
									@change="emit('toggle-transport', type.id)"
								/>
								<span class="checkbox-custom"></span>
								<span class="checkbox-text">{{ type.name }}</span>
							</label>
						</div>
					</div>
				</div>

				<div class="options-section">
					<h3>启用维度</h3>
					<div class="dimension-checkboxes">
						<div v-for="dim in dimensionOptions" :key="dim.id" class="checkbox-item">
							<label class="checkbox-label">
								<input
									type="checkbox"
									:checked="!dim.disabled"
									class="checkbox-input"
									@change="emit('toggle-dimension', dim.id)"
								/>
								<span class="checkbox-custom"></span>
								<span class="checkbox-text">{{ dim.name }}</span>
							</label>
						</div>
					</div>
				</div>

				<div class="current-settings">
					<p v-if="bannedTypes.length > 0">
						禁用交通方式: {{ bannedTypes.map((t) => transportTypes.find((tt) => tt.int_name === t)?.name).join(', ') }}
					</p>
					<p v-if="bannedDims.length > 0">
						禁用维度: {{ bannedDims.map((d) => dimensionOptions.find((dd) => dd.id === d)?.name).join(', ') }}
					</p>
					<p v-if="bannedTypes.length === 0 && bannedDims.length === 0">当前不禁用任何交通方式和维度</p>
				</div>
			</div>

			<div class="popup-footer">
				<button class="apply-button" @click="emit('close')">应用选项</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
.options-popup-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 2000;
}

.options-popup {
	background: var(--background);
	border-radius: 18px;
	width: 90%;
	max-width: 500px;
	max-height: 80vh;
	overflow-y: auto;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.popup-header,
.popup-content,
.popup-footer {
	padding: 1.5rem;
}

.popup-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.popup-header h2,
.options-section h3 {
	margin: 0;
	color: var(--text);
}

.close-button {
	background: none;
	border: none;
	font-size: 2rem;
	color: var(--text-secondary);
	cursor: pointer;
	padding: 0;
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
}

.close-button:hover {
	background: var(--background-secondary);
	color: lightcoral;
}

.options-section {
	margin-bottom: 1.5rem;
}

.preset-buttons {
	display: flex;
	gap: 1rem;
	flex-wrap: wrap;
}

.preset-button,
.apply-button {
	padding: 0.55rem 1rem;
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
	border-radius: 10px;
	font-size: 0.9rem;
	cursor: pointer;
	border: none;
}

.preset-button:hover,
.apply-button:hover {
	background: var(--button-primary-hover);
}

.transport-checkboxes,
.dimension-checkboxes {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 0.5rem;
}

.checkbox-label {
	display: flex;
	align-items: center;
	cursor: pointer;
	padding: 0.5rem;
	border-radius: 8px;
	transition: background-color 0.2s;
}

.checkbox-label:hover {
	background: var(--background-secondary);
}

.checkbox-input {
	display: none;
}

.checkbox-custom {
	width: 18px;
	height: 18px;
	border-radius: 3px;
	margin-right: 0.75rem;
	position: relative;
	transition: all 0.2s;
	border: 1px solid var(--split);
}

.checkbox-input:checked + .checkbox-custom {
	background: var(--primary);
	border-color: var(--primary);
}

.checkbox-input:checked + .checkbox-custom::after {
	content: '';
	position: absolute;
	top: 2px;
	left: 5px;
	width: 5px;
	height: 10px;
	border: solid white;
	border-width: 0 2px 2px 0;
	transform: rotate(45deg);
}

.checkbox-text {
	color: var(--text);
	font-size: 0.9rem;
}

.current-settings {
	margin-top: 1.5rem;
	padding: 1rem;
	background: var(--background-secondary);
	border-radius: 10px;
}

.current-settings p {
	margin: 0.25rem 0;
	font-size: 0.85rem;
	color: var(--text-secondary);
}

.popup-footer {
	text-align: right;
}

@media (max-width: 480px) {
	.transport-checkboxes,
	.dimension-checkboxes {
		grid-template-columns: 1fr;
	}
}
</style>
