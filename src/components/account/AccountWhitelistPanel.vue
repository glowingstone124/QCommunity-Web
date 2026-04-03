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
	border-radius: 26px;
	padding: 2.4rem;
	box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
	border: 1px solid var(--border-soft);
	display: flex;
	flex-direction: column;
	gap: 2rem;
	min-height: 65vh;
}

.panel-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 1rem;
}

.panel-title {
	font-size: 2rem;
	margin: 0;
	color: var(--title-color);
}

.panel-sub {
	margin: 0.25rem 0 0;
	color: var(--text-secondary);
}

.pill {
	padding: 0.35rem 0.9rem;
	border-radius: 999px;
	background: rgba(37, 99, 235, 0.12);
	color: var(--text-main);
	font-size: 0.9rem;
}

.section {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.section-title {
	font-size: 1.2rem;
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
	padding: 16px 18px;
	background-color: var(--glass-soft);
	border: 1px solid var(--border-soft);
	border-radius: 14px;
	font-size: 1rem;
	color: var(--text-main);
	box-shadow: inset 0 0 0 1px transparent;
}

input:focus {
	border-color: rgba(37, 99, 235, 0.6);
	box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.5);
}

.btn {
	border: none;
	padding: 12px 28px;
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
	border-radius: 14px;
	font-weight: 600;
	height: fit-content;
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
	gap: 0.6rem;
	flex-wrap: wrap;
}

.ip-chip {
	background: var(--surface-soft);
	border: 1px solid var(--border-soft);
	padding: 0.45rem 0.9rem;
	border-radius: 999px;
	font-family: 'Bahnschrift', 'GSans', sans-serif;
}

.empty {
	margin: 0;
	color: var(--text-secondary);
	font-size: 0.95rem;
}

@media (max-width: 960px) {
	.panel {
		padding: 1.6rem;
		min-height: unset;
	}

	.panel-header {
		flex-direction: column;
		align-items: flex-start;
	}
}
</style>
