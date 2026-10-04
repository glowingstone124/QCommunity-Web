<template>
	<main class="terms-page page-shell">
		<header class="terms-page-header">
			<div>
				<h1>{{ t('termsPage.title') }}</h1>
				<p class="terms-description">{{ t('termsPage.description') }}</p>
			</div>
			<router-link class="terms-back-link" to="/guides">{{ t('termsPage.backToGuides') }}</router-link>
		</header>

		<p v-if="isLoading" class="terms-status" aria-live="polite">{{ t('termsPage.loading') }}</p>
		<section v-else-if="errorMessage" class="terms-error" role="alert">
			<p>{{ errorMessage }}</p>
			<button type="button" @click="loadTerms">{{ t('termsPage.retry') }}</button>
		</section>
		<article v-else class="terms-document" data-selectable v-html="termsHtml"></article>
	</main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { loadTermsDocument } from '@/services/terms.js'

const { t } = useI18n()
const isLoading = ref(true)
const errorMessage = ref('')
const termsHtml = ref('')

async function loadTerms() {
	isLoading.value = true
	errorMessage.value = ''
	try {
		const document = await loadTermsDocument()
		termsHtml.value = document.html
	} catch (error) {
		console.error('Failed to load the user notice:', error)
		errorMessage.value = t('termsPage.loadFailed')
	} finally {
		isLoading.value = false
	}
}

onMounted(loadTerms)
</script>

<style scoped>
.terms-page {
	width: min(1040px, 100%);
	min-height: 100%;
	margin: 0 auto;
	padding: clamp(1.25rem, 4vw, 3.5rem);
	color: var(--text-main);
	box-sizing: border-box;
}

.terms-page-header {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 2rem;
	margin-bottom: clamp(2rem, 5vw, 3.5rem);
	padding-bottom: 1.5rem;
	border-bottom: 1px solid var(--split);
}

.terms-page-header h1 {
	margin: 0;
	color: var(--title-color);
	font-size: clamp(2rem, 5vw, 3.8rem);
	line-height: 1.08;
}

.terms-description {
	max-width: 680px;
	margin: 0.8rem 0 0;
	color: var(--text-secondary);
	font-size: 1.05rem;
	line-height: 1.6;
}

.terms-back-link {
	flex: none;
	color: var(--primary);
	font-weight: 720;
	text-decoration: none;
}

.terms-back-link:hover {
	text-decoration: underline;
}

.terms-status,
.terms-error {
	padding: 1rem;
	border: 1px solid var(--split);
	background: var(--background);
	line-height: 1.6;
}

.terms-error p {
	margin: 0 0 0.9rem;
}

.terms-error button {
	border: 1px solid var(--primary);
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
	padding: 0.65rem 0.9rem;
	cursor: pointer;
}

.terms-document {
	max-width: 840px;
	padding-bottom: 4rem;
	user-select: text;
	line-height: 1.75;
}

.terms-document :deep(h1),
.terms-document :deep(h2),
.terms-document :deep(h3) {
	color: var(--title-color);
	line-height: 1.3;
}

.terms-document :deep(h1) {
	font-size: clamp(1.8rem, 4vw, 2.8rem);
}

.terms-document :deep(h2) {
	margin-top: 2.2rem;
	padding-top: 1rem;
	border-top: 1px solid var(--split);
	font-size: 1.4rem;
}

.terms-document :deep(p),
.terms-document :deep(li) {
	color: var(--text-main);
	line-height: 1.8;
}

.terms-document :deep(ul),
.terms-document :deep(ol) {
	padding-left: 1.5rem;
}

.terms-document :deep(a) {
	color: var(--primary);
}

@media (max-width: 640px) {
	.terms-page-header {
		align-items: flex-start;
		flex-direction: column;
		gap: 1.1rem;
	}
}
</style>
