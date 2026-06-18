<script setup>
const props = defineProps({
	ipAddr: {
		type: String,
		default: '',
	},
	iplist: {
		type: Array,
		default: () => [],
	},
	isValidIp: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits(['submit', 'update:ipAddr'])
</script>

<template>
	<section class="panel">
		<header class="panel-header">
			<div>
				<h2 class="panel-title">IP过白</h2>
				<p class="panel-sub">仅允许登记过的海外 IP 登录</p>
			</div>
			<span class="pill">最多 5 个</span>
		</header>
		<div class="section">
			<div class="section-title">注册新 IP</div>
			<div class="form-row">
				<input
					:value="props.ipAddr"
					type="text"
					placeholder="例如：123.45.67.89"
					@input="emit('update:ipAddr', $event.target.value)"
				/>
				<button type="submit" class="btn" :disabled="!isValidIp" @click="emit('submit')">
					<span>提交</span>
				</button>
			</div>
			<p class="helper" :class="{ invalid: ipAddr && !isValidIp }">
				{{ ipAddr && !isValidIp ? 'IP 格式不正确，请检查后再提交。' : '请输入正确的 IPv4 地址。' }}
			</p>
		</div>
		<div class="section">
			<div class="section-title">已登记 IP</div>
			<div v-if="iplist.length" class="chip-grid">
				<div v-for="ip in iplist" :key="ip" class="ip-chip">
					<span>{{ ip }}</span>
				</div>
			</div>
			<p v-else class="empty">暂未登记 IP。</p>
		</div>
	</section>
</template>

<style scoped>
.panel {
	background: var(--glass-strong);
	border-radius: 0;
	padding: 1.4rem;
	border: none;
	display: flex;
	flex-direction: column;
	gap: 1.35rem;
	min-height: 100%;
	max-width: 1120px;
	width: 100%;
	margin: 0 auto;
	box-sizing: border-box;
}

.panel-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 1rem;
}

.panel-title {
	font-size: 1.45rem;
	margin: 0;
	color: var(--title-color);
	line-height: 1.2;
}

.panel-sub {
	margin: 0.25rem 0 0;
	color: var(--text-secondary);
}

.pill {
	padding: 0.35rem 0.65rem;
	border-radius: 0;
	background: var(--surface-soft);
	border: 1px solid var(--border-soft);
	color: var(--text-main);
	font-size: 0.86rem;
	white-space: nowrap;
}

.section {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	border: 1px solid var(--border-soft);
	border-radius: 0;
	padding: 1rem;
}

.section-title {
	font-size: 1rem;
	font-weight: 600;
	color: var(--title-color);
}

.form-row {
	display: flex;
	gap: 1rem;
	flex-wrap: wrap;
}

input[type='text'] {
	flex: 1;
	min-width: 220px;
	padding: 0.78rem 0.9rem;
	background-color: var(--glass-soft);
	border: 1px solid var(--border-soft);
	border-radius: 0;
	font-size: 1rem;
	color: var(--text-main);
}

input:focus {
	outline: none;
	border-color: var(--primary);
}

.btn {
	border: 1px solid var(--primary);
	padding: 0.78rem 1.25rem;
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
	border-radius: 0;
	font-weight: 600;
	height: fit-content;
	cursor: pointer;
}

.btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.btn:hover {
	background: var(--button-primary-hover);
}

.helper {
	margin: 0;
	color: var(--text-secondary);
	font-size: 0.9rem;
}

.helper.invalid {
	color: var(--error);
}

.chip-grid {
	display: flex;
	gap: 0.5rem;
	flex-wrap: wrap;
}

.ip-chip {
	background: var(--surface-soft);
	border: 1px solid var(--border-soft);
	padding: 0.45rem 0.9rem;
	font-family: 'Bahnschrift', 'GSans', sans-serif;
	color: var(--text-main);
}

.empty {
	margin: 0;
	color: var(--text-secondary);
	font-size: 0.95rem;
}

@media (max-width: 960px) {
	.panel {
		padding: 1rem;
		min-height: unset;
	}

	.panel-header {
		flex-direction: column;
		align-items: flex-start;
	}
}

@media (max-width: 640px) {
	.form-row {
		flex-direction: column;
		gap: 0.75rem;
	}

	input[type='text'] {
		min-width: 0;
		width: 100%;
		box-sizing: border-box;
	}

	.btn {
		width: 100%;
	}
}
</style>
