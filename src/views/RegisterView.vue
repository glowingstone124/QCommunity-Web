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

			<Transition name="step-swap" mode="out-in">
				<form v-if="quiz_seq === -1" :key="`form-${step}`" class="register-form" @submit.prevent="handleNext">
					<label v-if="step === 1" class="field">
						<span>{{ t('register.usernameLabel') }}</span>
						<input v-model="username" type="text" :placeholder="t('register.usernameLabel')" autocomplete="username" required />
					</label>

					<label v-if="step === 2" class="field">
						<span>{{ t('register.qqLabel') }}</span>
						<input v-model="qq" type="text" :placeholder="t('register.qqLabel')" inputmode="numeric" @input="validateQQ" required />
					</label>

					<label v-if="step === 3" class="field">
						<span>{{ t('register.passwordLabel') }}</span>
						<input v-model="password" type="password" :placeholder="t('register.passwordSetup')" autocomplete="new-password" minlength="8" required />
					</label>

					<label v-if="step === 3" class="field">
						<span>{{ t('register.confirmPasswordLabel') }}</span>
						<input v-model="confirmPassword" type="password" :placeholder="t('register.passwordAgain')" autocomplete="new-password" minlength="8" required />
					</label>

					<div v-if="step === 4" class="verification-options">
						<button
							v-for="method in verificationMethods"
							:key="method.id"
							type="button"
							class="verification-option"
							:class="{ selected: selectedVerificationMethod === method.id }"
							:disabled="!method.available || (minecraftSessionId && selectedVerificationMethod !== method.id)"
							@click="selectedVerificationMethod = method.id"
						>
							<strong>{{ method.displayName }}</strong>
							<span>{{ method.description }}</span>
							<small v-if="method.state === 'reserved'">{{ t('register.reserved') }}</small>
							<small v-else-if="method.state === 'unavailable'">{{ t('register.unavailable') }}</small>
						</button>
						<p v-if="verificationMethodsLoading" class="configuration-status">{{ t('register.loadingConfig') }}</p>
					</div>

					<div v-if="step === 4 && selectedVerificationMethod === 'quiz'" class="quiz-intro">
						<p>{{ t('register.quizIntro') }}</p>
						<p v-if="quizQuestionCount !== null && quizPassingScore !== null">
							{{ t('register.quizRule', { count: quizQuestionCount, score: quizPassingScore }) }}
						</p>
						<p v-else>{{ t('register.quizLoading') }}</p>
						<p>{{ t('register.quizBinding') }}</p>
					</div>

					<div v-if="step === 4 && selectedVerificationMethod === 'minecraft'" class="minecraft-intro">
						<p>{{ t('register.minecraftIntro') }}</p>
						<p class="server-address">{{ minecraftServerAddress }}</p>
						<p>{{ t('register.minecraftInstructions') }}</p>
						<p v-if="minecraftSessionId" class="minecraft-state">
							{{ t('register.minecraftStatus', { status: minecraftStateLabel }) }}
						</p>
						<small v-if="minecraftSessionId && minecraftExpiryText">{{ t('register.requestExpires', { time: minecraftExpiryText }) }}</small>
					</div>

					<p v-if="message" class="message" role="alert">{{ message }}</p>

					<button type="submit" class="primary-button" :disabled="isLoading || !canStartVerification">
						<span v-if="isLoading" class="spinner"></span>
						{{ primaryActionLabel }}
					</button>
				</form>

				<div v-else-if="step === 4 && quiz_seq < quizQuestions.length" :key="`quiz-${quiz_seq}`" class="quiz-section">
					<div class="quiz-window">
						<div>
							<h3>{{ quizQuestions[quiz_seq].text }}</h3>
						</div>
					</div>

					<div class="quiz-meta">
						<span>{{ t('register.remainingSeconds', { countdown }) }}</span>
						<button v-if="quiz_seq === 0" type="button" class="secondary-button" @click="switchPage">{{ t('register.skipWait') }}</button>
					</div>

					<div class="options">
						<button
							v-for="(option, optionIndex) in quizQuestions[quiz_seq].options"
							:key="optionIndex"
							type="button"
							@click="selectAnswer(optionIndex)"
						>
							{{ option }}
						</button>
					</div>
				</div>

				<div v-else :key="`result-${quiz_seq}`" class="result-panel">
					<p v-if="isSubmittingQuiz"><span class="spinner"></span>{{ t('register.checkingQuiz') }}</p>
					<p v-else-if="message" class="message">{{ message }}</p>
					<p v-else-if="quizResult && !quizResult.passed" class="message">
						{{ t('register.quizFailed', { score: quizResult.score, count: quizQuestionCount }) }}
					</p>
					<p v-else-if="quizResult?.passed && !isLoading" class="quiz-success">
						{{ t('register.quizPassed', { score: quizResult.score, count: quizQuestionCount, countdown }) }}
					</p>
					<p v-if="isLoading"><span class="spinner"></span>{{ t('register.registering') }}</p>
				</div>
			</Transition>

			<div class="panel-actions" v-if="step === 4 && quiz_seq === -1">
				<p class="configuration-status">{{ t('register.verificationNotice') }}</p>
			</div>

			<div class="terms">
				{{ t('register.termsBefore') }}
				<a href="https://qoriginal.vip/docs#/things_to_know">{{ t('register.termsLink') }}</a>{{ t('register.termsSuffix') }}
			</div>
		</section>

		<div v-if="isDialogVisible" class="dialog-overlay">
			<div class="dialog">
				<h2>{{ t(isDevMode ? 'register.devSuccessTitle' : 'register.successTitle') }}</h2>
				<h4 v-if="!isDevMode">{{ t('register.successMessage') }}</h4>
				<h4 v-else>{{ t('register.devSuccessMessage') }}</h4>
				<button @click="closeDialog">{{ t('common.confirm') }}</button>
			</div>
		</div>
	</div>
</template>

<script setup>
import { useRegistrationForm } from '@/composables/useRegistrationForm.js'

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
