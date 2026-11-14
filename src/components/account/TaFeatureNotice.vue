<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const props = defineProps({
	title: { type: String, required: true },
	message: { type: String, required: true },
	actionLabel: { type: String, default: '' },
	actionRoute: { type: String, default: '' },
})

const emit = defineEmits(['action'])
const router = useRouter()
const { t } = useI18n()

function handleAction() {
	if (props.actionRoute) {
		router.push(props.actionRoute)
		return
	}
	emit('action')
}
</script>

<template>
	<section class="ta-notice-card" role="status">
		<span class="ta-notice-badge">{{ t('taAccount.badge') }}</span>
		<h2 class="ta-notice-title">{{ title }}</h2>
		<p class="ta-notice-body">{{ message }}</p>
		<div class="ta-notice-actions">
			<button v-if="actionLabel" type="button" class="ta-notice-btn" @click="handleAction">
				{{ actionLabel }}
			</button>
			<a
				href="https://qm.qq.com/q/ca25kxwf0k"
				target="_blank"
				rel="noopener noreferrer"
				class="ta-notice-link"
			>
				{{ t('nav.join_us_qq') }}
			</a>
		</div>
	</section>
</template>

<style scoped>
.ta-notice-card {
	width: min(560px, 100%);
	border: 1px solid var(--border-soft, var(--split));
	background: var(--background);
	padding: 1.35rem;
	display: grid;
	gap: 0.75rem;
	box-sizing: border-box;
}

.ta-notice-badge {
	width: fit-content;
	border: 1px solid var(--primary);
	color: var(--primary);
	font-size: 0.78rem;
	font-weight: 700;
	padding: 0.16rem 0.5rem;
}

.ta-notice-title {
	margin: 0;
	color: var(--title-color, var(--text-main));
	font-size: 1.2rem;
}

.ta-notice-body {
	margin: 0;
	color: var(--text-secondary);
	font-size: 0.94rem;
	line-height: 1.6;
}

.ta-notice-actions {
	display: flex;
	align-items: center;
	gap: 0.85rem;
	flex-wrap: wrap;
	margin-top: 0.25rem;
}

.ta-notice-btn {
	border: 1px solid var(--primary);
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
	padding: 0.65rem 1rem;
	font-weight: 600;
	cursor: pointer;
}

.ta-notice-btn:hover {
	background: var(--button-primary-hover);
}

.ta-notice-link {
	color: var(--primary);
	font-weight: 600;
	text-decoration: underline;
}
</style>
