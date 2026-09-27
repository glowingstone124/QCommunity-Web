import { ref } from 'vue'
import { startRegistrationQuiz, submitRegistrationQuiz } from '@/services/registration.js'

export function useRegistrationQuiz({
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
}) {
	const quiz_seq = ref(-1)
	const isSubmittingQuiz = ref(false)
	const countdown = ref(0)
	const quizSessionId = ref('')
	const quizQuestions = ref([])
	const quizAnswers = ref([])
	const quizResult = ref(null)
	let countdownTimer = null

	function formatQuizSessionError(error) {
		const data = error?.data || {}
		const code = error?.code || data.code
		const baseMessage = data.message || error?.message || t('register.quizSessionUnavailable')

		if (code !== 'quiz_session_capacity_reached') return baseMessage

		const details = []
		if (Number.isInteger(data.activeSessions) && Number.isInteger(data.limit)) {
			details.push(t('register.activeSessions', { active: data.activeSessions, limit: data.limit }))
		}
		if (Number.isFinite(data.sessionTtlSeconds) && data.sessionTtlSeconds > 0) {
			const ttlMinutes = Math.ceil(data.sessionTtlSeconds / 60)
			details.push(t('register.sessionTtl', { minutes: ttlMinutes }))
		}

		return [baseMessage, ...details].join(' ')
	}

	function handleQuizSessionError(error) {
		message.value = formatQuizSessionError(error)
		const field = error?.field || error?.data?.field
		if (field === 'name') step.value = 1
		if (field === 'uid') step.value = 2
	}

	async function beginQuiz() {
		if (selectedVerificationMethod.value !== 'quiz') return
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
			verificationToken.value = ''
			quiz_seq.value = 0
			startQuestionCountdown()
		} catch (error) {
			handleQuizSessionError(error)
		} finally {
			isLoading.value = false
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
		message.value = ''
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

	return {
		quiz_seq,
		isSubmittingQuiz,
		countdown,
		quizQuestions,
		quizResult,
		beginQuiz,
		switchPage,
		selectAnswer,
		clearCountdown,
	}
}
