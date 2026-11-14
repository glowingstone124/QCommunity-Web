<template>
	<UiDocLayout
		class="terms-page"
		:nav-label="t('termsPage.toc')"
	>
		<template #sidebar-header>
			<div class="terms-sidebar-heading">
				<p class="terms-sidebar-title">{{ t('termsPage.toc') }}</p>
			</div>
		</template>

		<template #sidebar>
			<div class="terms-toc">
				<a
					v-for="section in termsSections"
					:key="section.id"
					:href="`#${section.id}`"
					class="ui-doc-nav-item"
					:class="{ 'is-active': activeSectionId === section.id }"
					@click.prevent="scrollToSection(section.id)"
				>
					<md-ripple v-if="isModernUi" />
					<span>{{ section.title }}</span>
				</a>
				<UiButton
					class="terms-sidebar-back"
					variant="tonal"
					size="sm"
					icon="arrow_back"
					to="/guides"
				>
					{{ t('termsPage.backToGuides') }}
				</UiButton>
			</div>
		</template>

		<UiPageHeader
			:title="t('termsPage.title')"
			:subtitle="t('termsPage.description')"
		>
			<template #actions>
				<UiButton variant="tonal" icon="arrow_back" to="/guides">
					{{ t('termsPage.backToGuides') }}
				</UiButton>
			</template>
		</UiPageHeader>

		<UiStatePanel
			v-if="isLoading"
			state="loading"
			:message="t('termsPage.loading')"
		/>
		<UiStatePanel
			v-else-if="errorMessage"
			state="error"
			:title="t('termsPage.loadFailed')"
			:action-label="t('termsPage.retry')"
			@action="loadTerms"
		/>
		<article v-else class="terms-document" data-selectable v-html="renderedTermsHtml"></article>
	</UiDocLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UiDocLayout from '@/components/ui/UiDocLayout.vue'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiStatePanel from '@/components/ui/UiStatePanel.vue'
import { loadTermsDocument } from '@/services/terms.js'
import { useUiPreferences } from '@/composables/useUiPreferences.js'

const { t } = useI18n()
const { isModernUi } = useUiPreferences()
const isLoading = ref(true)
const errorMessage = ref('')
const termsHtml = ref('')
const activeSectionId = ref('')

const parsedTerms = computed(() => {
	const raw = termsHtml.value || ''
	if (!raw || typeof DOMParser === 'undefined') {
		return { html: raw, toc: [] }
	}
	const parser = new DOMParser()
	const doc = parser.parseFromString(`<div>${raw}</div>`, 'text/html')
	const root = doc.body.firstElementChild
	if (!root) {
		return { html: raw, toc: [] }
	}
	const toc = []
	const headings = root.querySelectorAll('h2')
	headings.forEach((heading, index) => {
		const id = heading.id || `terms-section-${index + 1}`
		heading.id = id
		const title = (heading.textContent || '').trim()
		if (title) {
			toc.push({ id, title })
		}
	})
	return { html: root.innerHTML, toc }
})

const renderedTermsHtml = computed(() => parsedTerms.value.html)
const termsSections = computed(() => parsedTerms.value.toc)

function scrollToSection(id) {
	activeSectionId.value = id
	const target = document.getElementById(id)
	if (target) {
		const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
		target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
	}
}

async function loadTerms() {
	isLoading.value = true
	errorMessage.value = ''
	try {
		const document = await loadTermsDocument()
		termsHtml.value = document.html
		activeSectionId.value = parsedTerms.value.toc[0]?.id || ''
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
	background: var(--page-background);
}

.terms-sidebar-heading {
	width: 100%;
}

.terms-sidebar-title {
	margin: 0;
	color: var(--title-color);
	font-size: 1.35rem;
	font-weight: 700;
	line-height: 1.2;
}

.terms-toc {
	display: grid;
	gap: 0.3rem;
}

.terms-sidebar-back {
	margin-top: 0.75rem;
	justify-self: start;
}

.terms-document {
	max-width: 820px;
	padding-top: 1.5rem;
	padding-bottom: 4rem;
	user-select: text;
	line-height: 1.75;
	background: transparent;
	border: none;
	box-shadow: none;
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
	scroll-margin-top: 1.5rem;
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

/* Material Design 3 Unboxed Terms Document */
:global(:root[data-ui="modern"] .terms-page) {
	background: var(--md-sys-color-surface);
}

:global(:root[data-ui="modern"] .terms-page .terms-document) {
	background: transparent;
	border: none;
	border-radius: 0;
	box-shadow: none;
	padding: 1.5rem 0 4rem;
}
</style>
