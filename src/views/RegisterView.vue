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
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {
	getRegistrationVerificationMethods,
	getMinecraftRegistrationStatus,
	registerAccount,
	startMinecraftRegistration,
	startRegistrationQuiz,
	submitRegistrationQuiz,
} from "/src/services/registration";
import { markOnboardingPromptPending } from '@/composables/useOnboardingGuide.js'

const step = ref(1)
const quiz_seq = ref(-1)
const username = ref("")
const qq = ref("")
const password = ref("")
const confirmPassword = ref("")
const isDialogVisible = ref(false)
const message = ref("")
const isLoading = ref(false)
const isSubmittingQuiz = ref(false)
const countdown = ref(0)
const verificationMethodsLoading = ref(true)
const verificationMethods = ref([])
const selectedVerificationMethod = ref("")
const quizQuestionCount = ref(null)
const quizPassingScore = ref(null)
const quizSessionId = ref("")
const quizQuestions = ref([])
const quizAnswers = ref([])
const quizResult = ref(null)
const verificationToken = ref("")
const minecraftSessionId = ref("")
const minecraftState = ref("")
const minecraftExpiresAt = ref(0)
const minecraftPassed = ref(null)
const router = useRouter()
const { t, locale } = useI18n()
const isDevMode = import.meta.env.DEV
let countdownTimer = null
let minecraftPollingTimer = null
let minecraftStatusInFlight = false

const stepItems = [
	{ id: 1, labelKey: "register.stepUsername" },
	{ id: 2, labelKey: "register.stepQq" },
	{ id: 3, labelKey: "register.stepPassword" },
	{ id: 4, labelKey: "register.stepVerify" },
]

const currentStepTitle = computed(() => {
	if (step.value === 1) return t('register.stepUsernameTitle')
	if (step.value === 2) return t('register.stepQqTitle')
	if (step.value === 3) return t('register.stepPasswordTitle')
	return t('register.stepVerifyTitle')
})

const currentStepDescription = computed(() => {
	if (step.value === 1) return t('register.stepUsernameDescription')
	if (step.value === 2) return t('register.stepQqDescription')
	if (step.value === 3) return t('register.stepPasswordDescription')
	return t('register.stepVerifyDescription')
})

const selectedMinecraftMethod = computed(() =>
	verificationMethods.value.find(method => method.id === "minecraft")
)

const minecraftServerAddress = computed(() =>
	selectedMinecraftMethod.value?.serverAddress || "qoriginal.vip"
)

const minecraftStateLabel = computed(() => {
	if (minecraftState.value === "pending") return t('register.statePending')
	if (minecraftState.value === "claimed") return t('register.stateClaimed')
	if (minecraftState.value === "completed" && minecraftPassed.value) return t('register.statePassed')
	if (minecraftState.value === "completed") return t('register.stateFailed')
	return t('register.stateCreating')
})

const minecraftExpiryText = computed(() => {
	if (!minecraftExpiresAt.value) return ""
	return new Date(minecraftExpiresAt.value).toLocaleTimeString(locale.value === 'zh' ? "zh-CN" : "en-US", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	})
})

const primaryActionLabel = computed(() => {
	if (step.value <= 3) return isDevMode ? t('register.nextDev') : t('register.next')
	if (selectedVerificationMethod.value === "minecraft") {
		if (minecraftSessionId.value) return t('register.waitMinecraft')
		return isLoading.value ? t('register.creatingMinecraft') : t('register.createMinecraft')
	}
	return isLoading.value ? t('register.creatingQuiz') : t('register.joinQuiz')
})

const canStartVerification = computed(() => {
	if (step.value < 4) return true
	if (verificationMethodsLoading.value) return false
	const selected = verificationMethods.value.find(method => method.id === selectedVerificationMethod.value)
	if (!selected?.available) return false
	if (selected.id === "minecraft") return !minecraftSessionId.value
	return selected.id !== "quiz" ||
		(Number.isInteger(quizQuestionCount.value) && Number.isInteger(quizPassingScore.value))
})

function validateQQ() {
	qq.value = qq.value.replace(/\D/g, "")
	return /^\d{5,12}$/.test(qq.value)
}

function validateMinecraftUsername() {
	return /^[A-Za-z0-9_]{3,16}$/.test(username.value)
}

function formatQuizSessionError(error) {
	const data = error?.data || {}
	const code = error?.code || data.code
	const baseMessage = data.message || error?.message || t('register.quizSessionUnavailable')

	if (code !== "quiz_session_capacity_reached") return baseMessage

	const details = []
	if (Number.isInteger(data.activeSessions) && Number.isInteger(data.limit)) {
		details.push(t('register.activeSessions', { active: data.activeSessions, limit: data.limit }))
	}
	if (Number.isFinite(data.sessionTtlSeconds) && data.sessionTtlSeconds > 0) {
		const ttlMinutes = Math.ceil(data.sessionTtlSeconds / 60)
		details.push(t('register.sessionTtl', { minutes: ttlMinutes }))
	}

	return [baseMessage, ...details].join(" ")
}

function handleQuizSessionError(error) {
	message.value = formatQuizSessionError(error)
	const field = error?.field || error?.data?.field
	if (field === "name") step.value = 1
	if (field === "uid") step.value = 2
}

async function validateUsername() {
	const url = `https://api.qoriginal.vip/qo/download/registry?name=${username.value}`
	const res = await fetch(url).then(r => r.json()).catch(() => null)
	return res?.code === 0
}

async function loadVerificationMethods() {
	verificationMethodsLoading.value = true
	try {
		const catalog = await getRegistrationVerificationMethods()
		verificationMethods.value = Array.isArray(catalog.methods) ? catalog.methods : []
		const quiz = verificationMethods.value.find(method => method.id === "quiz")
		quizQuestionCount.value = Number.isInteger(quiz?.questionCount) ? quiz.questionCount : null
		quizPassingScore.value = Number.isInteger(quiz?.passingScore) ? quiz.passingScore : null
		const requestedDefault = verificationMethods.value.find(
			method => method.id === catalog.defaultMethod && method.available,
		)
		selectedVerificationMethod.value =
			requestedDefault?.id || verificationMethods.value.find(method => method.available)?.id || ""
		if (!selectedVerificationMethod.value) {
			message.value = t('register.noVerificationMethod')
		}
	} catch (error) {
		verificationMethods.value = []
		selectedVerificationMethod.value = ""
		quizQuestionCount.value = null
		quizPassingScore.value = null
		message.value = error.message
	} finally {
		verificationMethodsLoading.value = false
	}
}

async function handleNext() {
	message.value = ""

	if (step.value === 1) {
		if (!isDevMode && !validateMinecraftUsername()) {
			message.value = t('register.invalidUsername')
			return
		}
		if (!isDevMode && await validateUsername(username.value)) {
			message.value = t('register.usernameTaken')
			return
		}
		step.value++
	} else if (step.value === 2) {
		if (!isDevMode && !validateQQ()) {
			message.value = t('register.invalidQq')
			return
		}
		step.value++
	} else if (step.value === 3) {
		if (!isDevMode && password.value.length < 8) {
			message.value = t('register.shortPassword')
			return
		}
		if (!isDevMode && password.value !== confirmPassword.value) {
			message.value = t('register.passwordMismatch')
			return
		}
		step.value++
	} else if (step.value === 4) {
		await beginVerification()
	}
}

async function beginVerification() {
	if (selectedVerificationMethod.value === "minecraft") {
		await beginMinecraftTest()
		return
	}
	await beginQuiz()
}

async function beginQuiz() {
	if (selectedVerificationMethod.value !== "quiz") return
	isLoading.value = true
	try {
		const session = await startRegistrationQuiz(username.value, Number(qq.value))
		if (!Array.isArray(session.questions) || session.questions.length === 0) {
			throw new Error(t('register.invalidQuiz'))
		}
		if (!Number.isInteger(session.questionCount) || !Number.isInteger(session.passingScore)) {
			throw new Error(t('register.invalidQuizConfig'))
		}
		if (session.questionCount !== session.questions.length) {
			throw new Error(t('register.quizCountMismatch'))
		}
		quizSessionId.value = session.sessionId
		quizQuestions.value = session.questions
		quizAnswers.value = Array(session.questions.length).fill(-1)
		quizQuestionCount.value = session.questionCount
		quizPassingScore.value = session.passingScore
		quizResult.value = null
		verificationToken.value = ""
		quiz_seq.value = 0
		startQuestionCountdown()
	} catch (error) {
		handleQuizSessionError(error)
	} finally {
		isLoading.value = false
	}
}

async function beginMinecraftTest() {
	if (minecraftSessionId.value || isLoading.value) return
	isLoading.value = true
	message.value = ""
	verificationToken.value = ""
	try {
		const session = await startMinecraftRegistration(username.value, Number(qq.value))
		if (!session.sessionId || session.state !== "pending") {
			throw new Error(t('register.invalidMinecraftSession'))
		}
		minecraftSessionId.value = session.sessionId
		minecraftState.value = session.state
		minecraftExpiresAt.value = Number(session.expiresAt || 0)
		minecraftPassed.value = null
		startMinecraftPolling()
	} catch (error) {
		message.value = error.message
		minecraftSessionId.value = ""
		minecraftState.value = ""
	} finally {
		isLoading.value = false
	}
}

function clearMinecraftPolling() {
	if (minecraftPollingTimer) clearInterval(minecraftPollingTimer)
	minecraftPollingTimer = null
}

function startMinecraftPolling() {
	clearMinecraftPolling()
	minecraftPollingTimer = setInterval(() => void syncMinecraftStatus(), 2000)
}

async function syncMinecraftStatus() {
	if (!minecraftSessionId.value || minecraftStatusInFlight) return
	minecraftStatusInFlight = true
	try {
		const result = await getMinecraftRegistrationStatus(
			minecraftSessionId.value,
			username.value,
			Number(qq.value),
		)
		minecraftState.value = result.state || minecraftState.value
		minecraftExpiresAt.value = Number(result.expiresAt || minecraftExpiresAt.value)
		if (result.state !== "completed") return

		clearMinecraftPolling()
		minecraftPassed.value = result.passed === true
		if (!minecraftPassed.value || !result.verificationToken) {
			message.value = t('register.minecraftFailed')
			minecraftSessionId.value = ""
			return
		}
		verificationToken.value = result.verificationToken
		await submitForm()
	} catch (error) {
		if (error.status === 410) {
			clearMinecraftPolling()
			minecraftSessionId.value = ""
			minecraftState.value = ""
		}
		message.value = error.message
	} finally {
		minecraftStatusInFlight = false
	}
}

function clearCountdown() {
	if (countdownTimer) clearInterval(countdownTimer)
	countdownTimer = null
}

function startQuestionCountdown() {
	clearCountdown()
	countdown.value = quizQuestions.value[quiz_seq.value]?.timeLimitSeconds || 0
	countdownTimer = setInterval(() => {
		countdown.value--
		if (countdown.value <= 0) advanceQuiz()
	}, 1000)
}

function switchPage() {
	advanceQuiz()
}

function selectAnswer(optionIndex) {
	quizAnswers.value[quiz_seq.value] = optionIndex
	advanceQuiz()
}

function advanceQuiz() {
	if (isSubmittingQuiz.value) return
	if (quiz_seq.value + 1 < quizQuestions.value.length) {
		quiz_seq.value++
		startQuestionCountdown()
		return
	}
	void finishQuiz()
}

async function finishQuiz() {
	clearCountdown()
	quiz_seq.value = quizQuestions.value.length
	isSubmittingQuiz.value = true
	message.value = ""
	try {
		const result = await submitRegistrationQuiz(
			quizSessionId.value,
			username.value,
			Number(qq.value),
			quizAnswers.value,
		)
		quizResult.value = result
		if (Number.isInteger(result.questionCount)) quizQuestionCount.value = result.questionCount
		if (Number.isInteger(result.passingScore)) quizPassingScore.value = result.passingScore
		if (result.passed && result.verificationToken) {
			verificationToken.value = result.verificationToken
			countdown.value = 5
			countdownTimer = setInterval(() => {
				countdown.value--
				if (countdown.value <= 0) {
					clearCountdown()
					void submitForm()
				}
			}, 1000)
		}
	} catch (error) {
		message.value = error.message
	} finally {
		isSubmittingQuiz.value = false
	}
}

async function submitForm() {
	if (!verificationToken.value || isLoading.value) return
	if (isDevMode) {
		isDialogVisible.value = true
		return
	}
	isLoading.value = true
	try {
		const result = await registerAccount(
			username.value,
			Number(qq.value),
			password.value,
			verificationToken.value,
			selectedVerificationMethod.value,
		)
		if (result.code === 0) {
			markOnboardingPromptPending()
			isDialogVisible.value = true
		} else {
			message.value = result.message || t('register.registerFailed')
		}
	} catch (error) {
		message.value = error.message
	} finally {
		isLoading.value = false
	}
}

function closeDialog() {
	isDialogVisible.value = false
	router.push("/")
}

onBeforeUnmount(() => {
	clearCountdown()
	clearMinecraftPolling()
})

onMounted(loadVerificationMethods)

</script>

<style scoped>
.register-page {
	--register-border: color-mix(in srgb, var(--text-main) 14%, transparent);
	display: grid;
	grid-template-columns: minmax(0, 0.9fr) minmax(420px, 760px);
	align-items: center;
	gap: clamp(1.5rem, 5vw, 4rem);
	min-height: calc(100dvh - var(--app-header-height, 0px));
	background: var(--page-background);
	color: var(--text-main);
	padding: clamp(1rem, 5vw, 4rem);
	box-sizing: border-box;
	overflow: auto;
}

:global(:root[data-theme='dark'] .register-page) {
	--register-border: color-mix(in srgb, var(--dark-text-primary) 18%, transparent);
	background: var(--page-background);
}

.register-copy {
	max-width: 680px;
}

.register-copy h1 {
	margin: 0;
	color: var(--title-color);
	font-size: clamp(2.3rem, 7vw, 5.6rem);
	font-weight: 420;
	line-height: 1.05;
}

.register-copy p {
	margin: 1rem 0 0;
	color: var(--text-secondary);
	font-size: clamp(1rem, 2.2vw, 1.35rem);
	line-height: 1.55;
}

.dev-banner {
	font-family: "SpaceMono";
	margin-top: 1rem;
	border: 1px solid color-mix(in srgb, var(--warning) 48%, var(--register-border));
	background: color-mix(in srgb, var(--warning) 10%, transparent);
	color: var(--text-main);
	padding: 0.85rem 1rem;
	line-height: 1.5;
}

.register-panel {
	border: 1px solid var(--register-border);
	background: color-mix(in srgb, var(--background) 94%, transparent);
	padding: 1.25rem;
	min-width: 0;
}

.panel-header {
	display: flex;
	justify-content: space-between;
	gap: 1rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid var(--register-border);
}

.step-counter {
	color: var(--text-secondary);
	font-size: 0.86rem;
	font-weight: 700;
}

.panel-header h2 {
	margin: 0.35rem 0 0;
	color: var(--title-color);
	font-size: clamp(1.35rem, 2vw, 1.75rem);
	line-height: 1.2;
}

.panel-header p {
	margin: 0.4rem 0 0;
	color: var(--text-secondary);
	line-height: 1.5;
}

.progress-strip {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	border: 1px solid var(--register-border);
	margin: 1rem 0;
}

.progress-item {
	display: grid;
	gap: 0.28rem;
	padding: 0.75rem;
	border-right: 1px solid var(--register-border);
	color: var(--text-secondary);
}

.progress-item:last-child {
	border-right: none;
}

.progress-item span {
	font-size: 0.82rem;
	font-weight: 800;
}

.progress-item strong {
	font-size: 0.9rem;
}

.progress-item.active,
.progress-item.done {
	background: color-mix(in srgb, var(--primary) 10%, transparent);
	color: var(--text-main);
}

.step-swap-enter-active,
.step-swap-leave-active {
	transition:
		opacity 180ms linear,
		transform 180ms ease-out;
	will-change: opacity, transform;
}

.step-swap-enter-from {
	opacity: 0;
	transform: translateY(8px);
}

.step-swap-leave-to {
	opacity: 0;
	transform: translateY(-8px);
}

.register-form,
.quiz-section,
.result-panel,
.panel-actions {
	display: grid;
	gap: 1rem;
}

.verification-options {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.75rem;
}

.verification-option {
	display: grid;
	align-content: start;
	gap: 0.4rem;
	min-height: 120px;
	text-align: left;
	border: 1px solid var(--register-border);
	background: var(--background-secondary);
	color: var(--text-main);
}

.verification-option.selected {
	border-color: var(--primary);
	background: color-mix(in srgb, var(--primary) 10%, var(--background-secondary));
}

.verification-option:disabled {
	cursor: not-allowed;
	opacity: 0.62;
}

.verification-option span,
.verification-option small,
.configuration-status {
	color: var(--text-secondary);
	line-height: 1.45;
}

.configuration-status {
	grid-column: 1 / -1;
	margin: 0;
	font-size: 0.9rem;
}

.field {
	display: grid;
	gap: 0.45rem;
}

.field span {
	color: var(--text-secondary);
	font-size: 0.88rem;
}

input {
	width: 100%;
	box-sizing: border-box;
	padding: 0.95rem 1rem;
	border: 1px solid var(--register-border);
	border-radius: 0;
	background: var(--background-secondary);
	font-size: 1rem;
	color: var(--text-main);
	outline: none;
}

input:focus {
	border-color: var(--primary);
}

button {
	width: 100%;
	min-height: 48px;
	padding: 0.82rem 1rem;
	border-radius: 0;
	font-size: 0.98rem;
	font-weight: 700;
	cursor: pointer;
}

.primary-button,
.dialog button {
	border: 1px solid var(--primary);
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
}

.primary-button:hover,
.dialog button:hover {
	background: var(--button-primary-hover);
}

.secondary-button,
.options button {
	border: 1px solid var(--register-border);
	background: var(--background-secondary);
	color: var(--text-main);
}

.secondary-button:hover,
.options button:hover {
	border-color: var(--primary);
}

.options {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.65rem;
}

.message,
.quiz-success,
.result-panel {
	border: 1px solid var(--register-border);
	padding: 0.78rem 0.85rem;
	font-size: 0.9rem;
	line-height: 1.5;
}

.message {
	color: var(--error);
	border-color: color-mix(in srgb, var(--error) 45%, var(--register-border));
	background: color-mix(in srgb, var(--error) 10%, transparent);
}

.quiz-success {
	color: var(--success);
	border-color: color-mix(in srgb, var(--success) 45%, var(--register-border));
	background: color-mix(in srgb, var(--success) 10%, transparent);
}

.spinner {
	border: 3px solid var(--button-primary-text);
	border-top: 3px solid transparent;
	border-radius: 50%;
	width: 1rem;
	height: 1rem;
	display: inline-block;
	animation: spin 1s linear infinite;
	margin-right: 5px;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.dialog-overlay {
	position: fixed;
	inset: 0;
	background: color-mix(in srgb, var(--background) 30%, rgba(0, 0, 0, 0.62));
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 20;
	padding: 1rem;
	box-sizing: border-box;
}

.quiz-intro,
.minecraft-intro,
.quiz-window {
	overflow-y: auto;
	max-height: min(42vh, 420px);
	border: 1px solid var(--register-border);
	padding: 1rem;
	color: var(--text-main);
	background: var(--background-secondary);
	line-height: 1.7;
}

.server-address {
	font-family: "SpaceMono", monospace;
	font-size: 1.05rem;
	font-weight: 800;
	user-select: all;
}

.minecraft-state {
	color: var(--primary);
	font-weight: 700;
}

.quiz-window h3 {
	margin: 0 0 0.75rem;
	color: var(--title-color);
}

.quiz-window p,
.quiz-intro p {
	margin: 0 0 0.75rem;
}

.quiz-window p:last-child,
.quiz-intro p:last-child {
	margin-bottom: 0;
}

.quiz-meta {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	color: var(--text-secondary);
}

.quiz-meta .secondary-button {
	width: fit-content;
}

.dialog {
	background: var(--background);
	border: 1px solid var(--register-border);
	padding: 1.25rem;
	max-width: 520px;
	width: 100%;
	color: var(--text-main);
}

.dialog h2 {
	margin: 0 0 0.75rem;
	color: var(--title-color);
}

.dialog h4 {
	margin: 0 0 1rem;
	color: var(--text-secondary);
	line-height: 1.55;
}

.terms {
	margin-top: 1rem;
	padding-top: 1rem;
	border-top: 1px solid var(--register-border);
	color: var(--text-main);
	line-height: 1.5;
	font-size: 0.92rem;
}

a {
	color: var(--primary);
	font-weight: 700;
	text-decoration: none;
}

a:hover {
	text-decoration: underline;
}

@media (max-width: 980px) {
	.register-page {
		grid-template-columns: 1fr;
		align-items: start;
	}

	.register-copy {
		max-width: none;
	}
}

@media (max-width: 640px) {
	.register-page {
		padding: 1rem;
	}

	.register-panel {
		padding: 1rem;
	}

	.progress-strip {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.progress-item:nth-child(2n) {
		border-right: none;
	}

	.progress-item:nth-child(-n + 2) {
		border-bottom: 1px solid var(--register-border);
	}

	.options {
		grid-template-columns: 1fr;
	}

	.verification-options {
		grid-template-columns: 1fr;
	}

	.quiz-meta {
		flex-direction: column;
		align-items: stretch;
	}

	.quiz-meta .secondary-button {
		width: 100%;
	}
}
</style>
