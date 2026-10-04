<template>
	<div v-if="isRequired" class="terms-review-overlay" role="presentation">
		<section class="terms-review-dialog" role="dialog" aria-modal="true" :aria-labelledby="'terms-review-title'">
			<header class="terms-review-header">
				<h2 id="terms-review-title">{{ t('termsPage.reviewTitle') }}</h2>
				<p>{{ t('termsPage.reviewDescription') }}</p>
			</header>

			<div
				v-if="isChecking && !termsHtml"
				class="terms-review-loading"
				aria-live="polite"
			>
				{{ t('termsPage.loading') }}
			</div>
			<div
				v-else-if="termsHtml"
				ref="termsContent"
				class="terms-review-content terms-document"
				data-selectable
				@scroll="updateReadState"
				v-html="termsHtml"
			></div>
			<div v-else class="terms-review-error" role="alert">
				<p>{{ t('termsPage.loadFailed') }}</p>
				<button type="button" @click="checkCurrentAgreement(true)">{{ t('termsPage.retry') }}</button>
			</div>

			<footer class="terms-review-footer">
				<p v-if="!hasReadToEnd && termsHtml" class="terms-review-hint">{{ t('termsPage.readToEnd') }}</p>
				<label class="terms-review-checkbox">
					<input v-model="isChecked" type="checkbox" :disabled="!hasReadToEnd || !termsVersion" />
					<span>{{ t('termsPage.agreementLabel') }}</span>
				</label>
				<p v-if="errorMessage && termsHtml" class="terms-review-error-text" role="alert">{{ errorMessage }}</p>
				<div class="terms-review-actions">
					<button type="button" class="terms-logout-button" @click="signOut">{{ t('termsPage.signOut') }}</button>
					<button
						type="button"
						class="terms-accept-button"
						:disabled="!isChecked || !username || !termsVersion || isSaving"
						@click="acceptCurrentTerms"
					>
						{{ isSaving ? t('termsPage.saving') : t('termsPage.accept') }}
					</button>
				</div>
			</footer>
		</section>
	</div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import {
	getTermsAcceptanceKey,
	hasAcceptedTerms,
	loadTermsDocument,
	resolveAuthenticatedUsername,
	saveTermsAcceptance,
} from '@/services/terms.js'

const { t } = useI18n()
const route = useRoute()
const isRequired = ref(false)
const isChecking = ref(false)
const isChecked = ref(false)
const hasReadToEnd = ref(false)
const isSaving = ref(false)
const termsHtml = ref('')
const termsVersion = ref('')
const username = ref('')
const errorMessage = ref('')
const termsContent = ref(null)
let lastIdentity = ''
let checkSequence = 0

function updateReadState() {
	const content = termsContent.value
	if (!content) return
	hasReadToEnd.value = content.scrollTop + content.clientHeight >= content.scrollHeight - 8
}

async function checkCurrentAgreement(force = false) {
	const token = localStorage.getItem('token') || ''
	const savedUsername = localStorage.getItem('username')?.trim() || ''
	const identity = token ? `${token}:${savedUsername}` : ''
	if (!token) {
		checkSequence += 1
		lastIdentity = ''
		isChecking.value = false
		isRequired.value = false
		username.value = ''
		termsHtml.value = ''
		termsVersion.value = ''
		errorMessage.value = ''
		return
	}
	if (!force && identity === lastIdentity && (termsVersion.value || errorMessage.value)) return
	const identityChanged = identity !== lastIdentity
	if (identityChanged) {
		isRequired.value = true
		termsHtml.value = ''
		termsVersion.value = ''
		username.value = savedUsername
		isChecked.value = false
		hasReadToEnd.value = false
	}
	lastIdentity = identity
	const sequence = ++checkSequence
	isChecking.value = true
	errorMessage.value = ''

	try {
		const [accountName, document] = await Promise.all([
			resolveAuthenticatedUsername(token),
			loadTermsDocument(),
		])
		if (sequence !== checkSequence) return
		lastIdentity = `${token}:${accountName}`
		username.value = accountName
		const versionChanged = document.version !== termsVersion.value
		termsHtml.value = document.html
		termsVersion.value = document.version
		if (versionChanged) {
			isChecked.value = false
			hasReadToEnd.value = false
		}
		isRequired.value = !hasAcceptedTerms(accountName, document.version)
		if (versionChanged && isRequired.value) {
			await nextTick()
			if (termsContent.value) termsContent.value.scrollTop = 0
			updateReadState()
		}
	} catch (error) {
		if (sequence !== checkSequence) return
		console.error('Failed to check user notice acceptance:', error)
		errorMessage.value = t('termsPage.loadFailed')
		isRequired.value = true
	} finally {
		if (sequence === checkSequence) isChecking.value = false
	}
}

async function acceptCurrentTerms() {
	if (!isChecked.value || !hasReadToEnd.value || isSaving.value) return
	isSaving.value = true
	errorMessage.value = ''
	const reviewedVersion = termsVersion.value
	const sequence = checkSequence
	try {
		const latestDocument = await loadTermsDocument()
		if (sequence !== checkSequence) return
		if (latestDocument.version !== reviewedVersion) {
			termsHtml.value = latestDocument.html
			termsVersion.value = latestDocument.version
			isChecked.value = false
			hasReadToEnd.value = false
			errorMessage.value = t('termsPage.reviewUpdated')
			await nextTick()
			if (termsContent.value) termsContent.value.scrollTop = 0
			updateReadState()
			return
		}
		if (!saveTermsAcceptance(username.value, reviewedVersion)) {
			errorMessage.value = t('termsPage.saveFailed')
			return
		}
		isRequired.value = false
	} catch (error) {
		console.error('Failed to refresh user notice before acceptance:', error)
		errorMessage.value = t('termsPage.loadFailed')
	} finally {
		isSaving.value = false
	}
}

function signOut() {
	localStorage.removeItem('token')
	localStorage.removeItem('username')
	localStorage.removeItem('user')
	isRequired.value = false
	lastIdentity = ''
	window.location.assign('/login')
}

function handleStorageChange(event) {
	if (!event.key || event.key === 'token' || event.key === 'username' || event.key === getTermsAcceptanceKey(username.value)) {
		checkCurrentAgreement(true)
	}
}

function handleWindowFocus() {
	checkCurrentAgreement(true)
}

onMounted(() => {
	checkCurrentAgreement()
	window.addEventListener('storage', handleStorageChange)
	window.addEventListener('focus', handleWindowFocus)
})

watch(() => route.fullPath, () => checkCurrentAgreement(true))

onBeforeUnmount(() => {
	window.removeEventListener('storage', handleStorageChange)
	window.removeEventListener('focus', handleWindowFocus)
})
</script>

<style scoped>
.terms-review-overlay {
	position: fixed;
	inset: 0;
	z-index: 10000;
	display: grid;
	place-items: center;
	padding: 1rem;
	background: rgba(8, 12, 19, 0.76);
}

.terms-review-dialog {
	width: min(880px, 100%);
	max-height: min(92dvh, 920px);
	display: grid;
	grid-template-rows: auto minmax(0, 1fr) auto;
	border: 1px solid var(--split);
	background: var(--page-background);
	color: var(--text-main);
	box-shadow: 0 24px 80px rgba(0, 0, 0, 0.38);
}

.terms-review-header {
	padding: clamp(1rem, 3vw, 1.6rem);
	border-bottom: 1px solid var(--split);
}

.terms-review-header h2 {
	margin: 0;
	color: var(--title-color);
	font-size: clamp(1.4rem, 3vw, 2rem);
}

.terms-review-header > p:last-child {
	margin: 0.5rem 0 0;
	color: var(--text-secondary);
	line-height: 1.5;
}

.terms-review-content {
	min-height: 0;
	max-width: none;
	margin: 0;
	padding: 1rem clamp(1rem, 3vw, 1.6rem);
	overflow: auto;
	user-select: text;
	line-height: 1.65;
}

.terms-review-loading {
	min-height: 10rem;
	display: grid;
	place-items: center;
	padding: 1rem;
	color: var(--text-secondary);
}

.terms-review-content :deep(h1),
.terms-review-content :deep(h2),
.terms-review-content :deep(h3) {
	color: var(--title-color);
}

.terms-review-content :deep(h2) {
	margin-top: 1.6rem;
	padding-top: 0.8rem;
	border-top: 1px solid var(--split);
}

.terms-review-content :deep(p),
.terms-review-content :deep(li) {
	line-height: 1.7;
}

.terms-review-footer {
	padding: 0.9rem clamp(1rem, 3vw, 1.6rem) 1rem;
	border-top: 1px solid var(--split);
}

.terms-review-hint {
	margin: 0 0 0.75rem;
	color: var(--text-secondary);
	font-size: 0.88rem;
}

.terms-review-checkbox {
	display: flex;
	align-items: flex-start;
	gap: 0.65rem;
	line-height: 1.5;
}

.terms-review-checkbox input {
	margin-top: 0.25rem;
}

.terms-review-error {
	padding: 1rem;
	color: var(--error);
}

.terms-review-error p {
	margin-top: 0;
}

.terms-review-error button {
	border: 1px solid var(--primary);
	background: var(--background);
	color: var(--text-main);
	padding: 0.55rem 0.8rem;
}

.terms-review-error-text {
	margin: 0.6rem 0 0;
	color: var(--error);
	font-size: 0.88rem;
}

.terms-review-actions {
	display: flex;
	justify-content: space-between;
	gap: 0.75rem;
	margin-top: 0.9rem;
}

.terms-review-actions button {
	min-height: 2.6rem;
	padding: 0.55rem 0.9rem;
	font-weight: 720;
	cursor: pointer;
}

.terms-logout-button {
	border: 1px solid var(--split);
	background: transparent;
	color: var(--text-main);
}

.terms-accept-button {
	border: 1px solid var(--primary);
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
}

.terms-accept-button:disabled {
	cursor: not-allowed;
	opacity: 0.55;
}
</style>
