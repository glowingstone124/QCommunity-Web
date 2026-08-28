<template>
	<div class="redirect" @click="handleRedirect">
		<p class="arrow" :style="{ color: textColor }">&lt;</p>
		<p :style="{ color: textColor }">{{ label }}</p>
	</div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { computed } from "vue";
import { useI18n } from 'vue-i18n'

defineProps({
	textColor: {
		type: String,
		default: "var(--text-main)"
	}
});

const { t } = useI18n()
const label = computed(() => t('common.backHome'))

const router = useRouter();

function handleRedirect() {
	router.push("/");
}
</script>

<style scoped>
.redirect {
	display: flex;
	align-items: center;
	cursor: pointer;
	margin-top: 20px;
}

.arrow {
	margin-right: 8px;
	transition: margin-right 0.2s;
}

.redirect:hover .arrow {
	margin-right: 12px;
}
</style>
