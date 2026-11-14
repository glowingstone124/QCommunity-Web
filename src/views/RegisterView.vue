<template>
	<div class="register-page">
	<section class="register-copy">
			<h1>{{ t('register.title') }}</h1>
			<p>{{ t('register.intro') }}</p>
			<div v-if="isDevMode" class="dev-banner">
				{{ t('auth.devBanner') }}
			</div>
		</section>

		<section class="register-panel">
			<header class="panel-header">
				<div>
					<span class="step-counter">{{ t('register.stepCounter', { step }) }}</span>
					<h2>{{ currentStepTitle }}</h2>
					<p>{{ currentStepDescription }}</p>
				</div>
			</header>

			<div class="progress-strip" aria-hidden="true">
				<div
					v-for="item in stepItems"
					:key="item.id"
					class="progress-item"
					:class="{ active: step === item.id, done: step > item.id }"
				>
					<span>{{ item.id }}</span>
					<strong>{{ t(item.labelKey) }}</strong>
				</div>
			</div>
			<md-linear-progress
				v-if="isModernUi"
				class="m3-register-progress"
				:value="Math.max(0.25, Math.min(1, step / Math.max(1, stepItems.length)))"
				:aria-label="t('register.stepCounter', { step })"
			/>

			<Transition name="step-swap" mode="out-in">
				<form v-if="quiz_seq === -1 || verificationToken" :key="`form-${step}`" class="register-form" @submit.prevent="handleNext">
					<label v-if="step === 1" class="field">
						<span>{{ t('register.usernameLabel') }}</span>
						<input v-model="username" type="text" :placeholder="t('register.usernameLabel')" autocomplete="username" autocorrect="off" autocapitalize="none" spellcheck="false" enterkeyhint="next" required />
					</label>

					<label v-if="step === 2" class="field">
						<span>{{ t('register.qqLabel') }}</span>
						<input v-model="qq" type="text" :placeholder="t('register.qqLabel')" inputmode="numeric" autocorrect="off" autocapitalize="none" spellcheck="false" enterkeyhint="next" @input="validateQQ" required />
					</label>

					<label v-if="step === 3" class="field">
						<span>{{ t('register.passwordLabel') }}</span>
						<input v-model="password" type="password" :placeholder="t('register.passwordSetup')" autocomplete="new-password" minlength="8" enterkeyhint="next" required />
					</label>

					<label v-if="step === 3" class="field">
						<span>{{ t('register.confirmPasswordLabel') }}</span>
						<input v-model="confirmPassword" type="password" :placeholder="t('register.passwordAgain')" autocomplete="new-password" minlength="8" enterkeyhint="done" required />
					</label>

					<div v-if="step === 4 && !verificationToken" class="verification-options">
						<button
							v-for="method in verificationMethods"
							:key="method.id"
							type="button"
							class="verification-option"
							:class="{ selected: selectedVerificationMethod === method.id }"
							:disabled="!method.available || (minecraftSessionId && selectedVerificationMethod !== method.id)"
							@click="selectedVerificationMethod = method.id"
						>
							<md-ripple v-if="isModernUi" />
							<strong>{{ method.displayName }}</strong>
							<span>{{ method.description }}</span>
							<small v-if="method.state === 'reserved'">{{ t('register.reserved') }}</small>
							<small v-else-if="method.state === 'unavailable'">{{ t('register.unavailable') }}</small>
						</button>
						<p v-if="verificationMethodsLoading" class="configuration-status">{{ t('register.loadingConfig') }}</p>
					</div>

					<div v-if="step === 4 && !verificationToken && selectedVerificationMethod === 'quiz'" class="quiz-intro">
						<p>{{ t('register.quizIntro') }}</p>
						<p v-if="quizQuestionCount !== null && quizPassingScore !== null">
							{{ t('register.quizRule', { count: quizQuestionCount, score: quizPassingScore }) }}
						</p>
						<p v-else>{{ t('register.quizLoading') }}</p>
						<p>{{ t('register.quizBinding') }}</p>
					</div>

					<div v-if="step === 4 && !verificationToken && selectedVerificationMethod === 'minecraft'" class="minecraft-intro">
						<p>{{ t('register.minecraftIntro') }}</p>
						<p class="server-address">{{ minecraftServerAddress }}</p>
						<p>{{ t('register.minecraftInstructions') }}</p>
						<p v-if="minecraftSessionId" class="minecraft-state">
							{{ t('register.minecraftStatus', { status: minecraftStateLabel }) }}
						</p>
						<small v-if="minecraftSessionId && minecraftExpiryText">{{ t('register.requestExpires', { time: minecraftExpiryText }) }}</small>
					</div>

					<div v-if="step === 4" class="terms">
						<p>{{ t('register.termsIntro') }}</p>
						<label class="terms-agreement">
							<input v-model="acceptedTerms" type="checkbox" :disabled="termsLoading || !termsVersion" required />
							<span>
								{{ t('register.termsConsentBefore') }}
								<router-link to="/terms" target="_blank" rel="noopener">{{ t('register.termsLink') }}</router-link>{{ t('register.termsConsentAfter') }}
							</span>
						</label>
						<p v-if="termsLoading" class="configuration-status">{{ t('register.termsLoading') }}</p>
						<div v-else-if="termsLoadError" class="terms-load-error" role="alert">
							<p>{{ t('register.termsLoadFailed') }}</p>
							<UiButton type="button" variant="tonal" size="sm" @click="reloadTerms">{{ t('register.termsRetry') }}</UiButton>
						</div>
					</div>
					<p v-if="verificationToken" class="configuration-status">
						{{ quizResult?.passed && countdown > 0
							? t('register.quizPassed', { score: quizResult.score, count: quizQuestionCount, countdown })
							: t('register.verificationPassed') }}
					</p>

					<UiStatePanel v-if="message" state="error" compact role="alert" :message="message" />

					<UiButton
						type="submit"
						variant="filled"
						size="lg"
						full-width
						class="primary-button"
						:loading="isLoading"
						:disabled="isLoading || !canStartVerification"
					>
						{{ primaryActionLabel }}
					</UiButton>
				</form>

				<div v-else-if="step === 4 && quiz_seq < quizQuestions.length" :key="`quiz-${quiz_seq}`" class="quiz-section">
					<div class="quiz-window">
						<div>
							<h3>{{ quizQuestions[quiz_seq].text }}</h3>
						</div>
					</div>

					<div class="quiz-meta">
						<span>{{ t('register.remainingSeconds', { countdown }) }}</span>
						<UiButton v-if="quiz_seq === 0" type="button" variant="tonal" size="sm" class="secondary-button" @click="switchPage">
							{{ t('register.skipWait') }}
						</UiButton>
					</div>

					<div class="options">
						<button
							v-for="(option, optionIndex) in quizQuestions[quiz_seq].options"
							:key="optionIndex"
							type="button"
							@click="selectAnswer(optionIndex)"
						>
							<md-ripple v-if="isModernUi" />
							<span>{{ option }}</span>
						</button>
					</div>
				</div>

				<div v-else :key="`result-${quiz_seq}`" class="result-panel">
					<p v-if="isSubmittingQuiz" class="state-loading">
						<md-circular-progress v-if="isModernUi" class="m3-inline-spinner" indeterminate :aria-label="t('register.checkingQuiz')" />
						<span v-else class="spinner"></span>
						<span>{{ t('register.checkingQuiz') }}</span>
					</p>
					<p v-else-if="message" class="message">{{ message }}</p>
					<p v-else-if="quizResult && !quizResult.passed" class="message">
						{{ t('register.quizFailed', { score: quizResult.score, count: quizQuestionCount }) }}
					</p>
					<p v-else-if="quizResult?.passed && !isLoading" class="quiz-success">
						{{ t('register.quizPassed', { score: quizResult.score, count: quizQuestionCount, countdown }) }}
					</p>
					<p v-if="isLoading" class="state-loading">
						<md-circular-progress v-if="isModernUi" class="m3-inline-spinner" indeterminate :aria-label="t('register.registering')" />
						<span v-else class="spinner"></span>
						<span>{{ t('register.registering') }}</span>
					</p>
				</div>
			</Transition>

			<div class="panel-actions" v-if="step === 4 && quiz_seq === -1">
				<p class="configuration-status">{{ t('register.verificationNotice') }}</p>
			</div>

		</section>

		<div
			v-if="isDialogVisible"
			class="dialog-overlay"
			role="dialog"
			aria-modal="true"
			:aria-label="t(isDevMode ? 'register.devSuccessTitle' : 'register.successTitle')"
		>
			<div class="dialog">
				<h2>{{ t(isDevMode ? 'register.devSuccessTitle' : 'register.successTitle') }}</h2>
				<p v-if="!isDevMode">{{ t('register.successMessage') }}</p>
				<p v-else>{{ t('register.devSuccessMessage') }}</p>
				<UiButton type="button" variant="filled" full-width @click="closeDialog">
					{{ t('common.confirm') }}
				</UiButton>
			</div>
		</div>
	</div>
</template>

<script setup>
import UiButton from '@/components/ui/UiButton.vue'
import UiStatePanel from '@/components/ui/UiStatePanel.vue'
import { useRegistrationForm } from '@/composables/useRegistrationForm.js'
import { useUiPreferences } from '@/composables/useUiPreferences.js'

const { isModernUi } = useUiPreferences()

const {
	t,
	step,
	username,
	qq,
	password,
	confirmPassword,
	isDialogVisible,
	message,
	isLoading,
	isSubmittingQuiz,
	countdown,
	verificationMethodsLoading,
	verificationMethods,
	selectedVerificationMethod,
	quiz_seq,
	quizQuestions,
	quizResult,
	quizQuestionCount,
	minecraftSessionId,
	minecraftStateLabel,
	minecraftExpiryText,
	minecraftServerAddress,
	primaryActionLabel,
	canStartVerification,
	verificationToken,
	acceptedTerms,
	termsLoading,
	termsLoadError,
	termsVersion,
	reloadTerms,
	isDevMode,
	stepItems,
	currentStepTitle,
	currentStepDescription,
	validateQQ,
	handleNext,
	switchPage,
	selectAnswer,
	closeDialog,
} = useRegistrationForm()
</script>

<style scoped src="./RegisterViewLayout.css"></style>
<style scoped src="./RegisterViewForm.css"></style>
