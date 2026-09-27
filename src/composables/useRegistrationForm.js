import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
	getRegistrationVerificationMethods,
	registerAccount,
} from '@/services/registration.js'
import { markOnboardingPromptPending } from '@/composables/useOnboardingGuide.js'
import { useMinecraftRegistration } from '@/composables/useMinecraftRegistration.js'
import { useRegistrationQuiz } from '@/composables/useRegistrationQuiz.js'

const stepItems = [
	{ id: 1, labelKey: 'register.stepUsername' },
	{ id: 2, labelKey: 'register.stepQq' },
	{ id: 3, labelKey: 'register.stepPassword' },
	{ id: 4, labelKey: 'register.stepVerify' },
]

export function useRegistrationForm() {
	const step = ref(1)
	const username = ref('')
	const qq = ref('')
	const password = ref('')
	const confirmPassword = ref('')
	const isDialogVisible = ref(false)
	const message = ref('')
	const isLoading = ref(false)
	const verificationMethodsLoading = ref(true)
	const verificationMethods = ref([])
	const selectedVerificationMethod = ref('')
	const quizQuestionCount = ref(null)
	const quizPassingScore = ref(null)
	const verificationToken = ref('')
	const router = useRouter()
	const { t, locale } = useI18n()
	const isDevMode = import.meta.env.DEV

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

	const quiz = useRegistrationQuiz({
		message,
		isLoading,
		username,
		qq,
		step,
		selectedVerificationMethod,
		quizQuestionCount,
		quizPassingScore,
		verificationToken,
		submitForm,
		t,
	})
	const minecraft = useMinecraftRegistration({
		username,
		qq,
		isLoading,
		message,
		verificationToken,
		submitForm,
		t,
	})

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
		verificationMethods.value.find((method) => method.id === 'minecraft'),
	)

	const minecraftServerAddress = computed(() =>
		selectedMinecraftMethod.value?.serverAddress || 'qoriginal.vip',
	)

	const minecraftStateLabel = computed(() => {
		if (minecraft.minecraftState.value === 'pending') return t('register.statePending')
		if (minecraft.minecraftState.value === 'claimed') return t('register.stateClaimed')
		if (minecraft.minecraftState.value === 'completed' && minecraft.minecraftPassed.value) {
			return t('register.statePassed')
		}
		if (minecraft.minecraftState.value === 'completed') return t('register.stateFailed')
		return t('register.stateCreating')
	})

	const minecraftExpiryText = computed(() => {
		if (!minecraft.minecraftExpiresAt.value) return ''
		return new Date(minecraft.minecraftExpiresAt.value).toLocaleTimeString(
			locale.value === 'zh' ? 'zh-CN' : 'en-US',
			{
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
			},
		)
	})

	const primaryActionLabel = computed(() => {
		if (step.value <= 3) return isDevMode ? t('register.nextDev') : t('register.next')
		if (selectedVerificationMethod.value === 'minecraft') {
			if (minecraft.minecraftSessionId.value) return t('register.waitMinecraft')
			return isLoading.value ? t('register.creatingMinecraft') : t('register.createMinecraft')
		}
		return isLoading.value ? t('register.creatingQuiz') : t('register.joinQuiz')
	})

	const canStartVerification = computed(() => {
		if (step.value < 4) return true
		if (verificationMethodsLoading.value) return false
		const selected = verificationMethods.value.find(
			(method) => method.id === selectedVerificationMethod.value,
		)
		if (!selected?.available) return false
		if (selected.id === 'minecraft') return !minecraft.minecraftSessionId.value
		return selected.id !== 'quiz' ||
			(Number.isInteger(quizQuestionCount.value) && Number.isInteger(quizPassingScore.value))
	})

	function validateQQ() {
		qq.value = qq.value.replace(/\D/g, '')
		return /^\d{5,12}$/.test(qq.value)
	}

	function validateMinecraftUsername() {
		return /^[A-Za-z0-9_]{3,16}$/.test(username.value)
	}

	async function validateUsername() {
		const url = `https://api.qoriginal.vip/qo/download/registry?name=${username.value}`
		const res = await fetch(url).then((response) => response.json()).catch(() => null)
		return res?.code === 0
	}

	async function loadVerificationMethods() {
		verificationMethodsLoading.value = true
		try {
			const catalog = await getRegistrationVerificationMethods()
			verificationMethods.value = Array.isArray(catalog.methods) ? catalog.methods : []
			const quizMethod = verificationMethods.value.find((method) => method.id === 'quiz')
			quizQuestionCount.value = Number.isInteger(quizMethod?.questionCount)
				? quizMethod.questionCount
				: null
			quizPassingScore.value = Number.isInteger(quizMethod?.passingScore)
				? quizMethod.passingScore
				: null
			const requestedDefault = verificationMethods.value.find(
				(method) => method.id === catalog.defaultMethod && method.available,
			)
			selectedVerificationMethod.value =
				requestedDefault?.id || verificationMethods.value.find((method) => method.available)?.id || ''
			if (!selectedVerificationMethod.value) {
				message.value = t('register.noVerificationMethod')
			}
		} catch (error) {
			verificationMethods.value = []
			selectedVerificationMethod.value = ''
			quizQuestionCount.value = null
			quizPassingScore.value = null
			message.value = error.message
		} finally {
			verificationMethodsLoading.value = false
		}
	}

	async function handleNext() {
		message.value = ''

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
		if (selectedVerificationMethod.value === 'minecraft') {
			await minecraft.beginMinecraftTest()
			return
		}
		await quiz.beginQuiz()
	}

	function closeDialog() {
		isDialogVisible.value = false
		router.push('/')
	}

	onBeforeUnmount(() => {
		quiz.clearCountdown()
		minecraft.clearMinecraftPolling()
	})

	onMounted(loadVerificationMethods)

	return {
		t,
		step,
		username,
		qq,
		password,
		confirmPassword,
		isDialogVisible,
		message,
		isLoading,
		isSubmittingQuiz: quiz.isSubmittingQuiz,
		countdown: quiz.countdown,
		verificationMethodsLoading,
		verificationMethods,
		selectedVerificationMethod,
		quiz_seq: quiz.quiz_seq,
		quizQuestions: quiz.quizQuestions,
		quizResult: quiz.quizResult,
		quizQuestionCount,
		minecraftSessionId: minecraft.minecraftSessionId,
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
		switchPage: quiz.switchPage,
		selectAnswer: quiz.selectAnswer,
		closeDialog,
	}
}
