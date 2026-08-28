<template>
	<div class="register-page">
		<section class="register-copy">
			<h1>加入 Quantum Original</h1>
			<p>让我们开始吧！</p>
			<div v-if="isDevMode" class="dev-banner">
				You are currently running a development version of QHub. This page is only for test purpose.
			</div>
		</section>

		<section class="register-panel">
			<header class="panel-header">
				<div>
					<span class="step-counter">第 {{ step }} / 4 步</span>
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
					<strong>{{ item.label }}</strong>
				</div>
			</div>

			<Transition name="step-swap" mode="out-in">
				<form v-if="quiz_seq === -1" :key="`form-${step}`" class="register-form" @submit.prevent="handleNext">
					<label v-if="step === 1" class="field">
						<span>Minecraft 用户名</span>
						<input v-model="username" type="text" placeholder="Minecraft 用户名" autocomplete="username" required />
					</label>

					<label v-if="step === 2" class="field">
						<span>QQ 号</span>
						<input v-model="qq" type="text" placeholder="QQ 号" inputmode="numeric" @input="validateQQ" required />
					</label>

					<label v-if="step === 3" class="field">
						<span>密码</span>
						<input v-model="password" type="password" placeholder="设置密码" autocomplete="new-password" minlength="8" required />
					</label>

					<label v-if="step === 3" class="field">
						<span>确认密码</span>
						<input v-model="confirmPassword" type="password" placeholder="再次输入密码" autocomplete="new-password" minlength="8" required />
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
							<small v-if="method.state === 'reserved'">接口已预留，暂未开放</small>
							<small v-else-if="method.state === 'unavailable'">当前配置不可用</small>
						</button>
						<p v-if="verificationMethodsLoading" class="configuration-status">正在读取服务端验证配置……</p>
					</div>

					<div v-if="step === 4 && selectedVerificationMethod === 'quiz'" class="quiz-intro">
						<p>为保证服务器秩序，Quantum Original 只接受初中含在读及以上学历，或具备一定文化常识与文字理解能力的玩家。</p>
						<p v-if="quizQuestionCount !== null && quizPassingScore !== null">
							测试共 {{ quizQuestionCount }} 道选择题。答对 {{ quizPassingScore }} 题方为通过。
						</p>
						<p v-else>正在从服务端读取题目数量与通过分数……</p>
						<p>测试通过后，请返回 QQ 群输入相应的 `.approve-register &lt;参数&gt;` 完成绑定验证。</p>
					</div>

					<div v-if="step === 4 && selectedVerificationMethod === 'minecraft'" class="minecraft-intro">
						<p>创建测试请求后，请使用上述 Minecraft 用户名连接测试服务器：</p>
						<p class="server-address">{{ minecraftServerAddress }}</p>
						<p>进入服务器后会自动领取本次请求。请勿关闭此页面；完成所有测试室后，页面会自动注册账户。</p>
						<p v-if="minecraftSessionId" class="minecraft-state">
							当前状态：{{ minecraftStateLabel }}
						</p>
						<small v-if="minecraftSessionId && minecraftExpiryText">请求有效期至 {{ minecraftExpiryText }}</small>
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
						<span>剩余 {{ countdown }} 秒</span>
						<button v-if="quiz_seq === 0" type="button" class="secondary-button" @click="switchPage">跳过等待</button>
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
					<p v-if="isSubmittingQuiz"><span class="spinner"></span>正在由服务端核算答题结果</p>
					<p v-else-if="message" class="message">{{ message }}</p>
					<p v-else-if="quizResult && !quizResult.passed" class="message">
						您的得分为 {{ quizResult.score }} / {{ quizQuestionCount }} 分，自助验证失败，请联系管理员并附上证明材料。
					</p>
					<p v-else-if="quizResult?.passed && !isLoading" class="quiz-success">
						您的得分为 {{ quizResult.score }} / {{ quizQuestionCount }} 分，自助验证成功，{{ countdown }} 秒后自动为您注册。
					</p>
					<p v-if="isLoading"><span class="spinner"></span>正在注册</p>
				</div>
			</Transition>

			<div class="panel-actions" v-if="step === 4 && quiz_seq === -1">
				<p class="configuration-status">请选择一种账户验证方式；验证结果与当前 Minecraft 用户名和 QQ 号绑定，且只能使用一次。</p>
			</div>

			<div class="terms">
				注册 QO 账号即代表您已经阅读并且同意
				<a href="https://qoriginal.vip/docs#/things_to_know">用户须知</a>。
			</div>
		</section>

		<div v-if="isDialogVisible" class="dialog-overlay">
			<div class="dialog">
				<h2>{{ isDevMode ? '开发模式预览完成' : '注册成功！' }}</h2>
				<h4 v-if="!isDevMode">欢迎加入 QOriginal！请在 QQ 群中发送确认信息（/approve-register &lt;&gt;）来激活您的账户。</h4>
				<h4 v-else>本次流程未调用真实注册接口。</h4>
				<button @click="closeDialog">确认</button>
			</div>
		</div>
	</div>
</template>


<script setup>
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import {
	getRegistrationVerificationMethods,
	getMinecraftRegistrationStatus,
	registerAccount,
	startMinecraftRegistration,
	startRegistrationQuiz,
	submitRegistrationQuiz,
} from "/src/services/registration";

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
const isDevMode = import.meta.env.DEV
let countdownTimer = null
let minecraftPollingTimer = null
let minecraftStatusInFlight = false

const stepItems = [
	{ id: 1, label: "用户名" },
	{ id: 2, label: "QQ" },
	{ id: 3, label: "密码" },
	{ id: 4, label: "核验" },
]

const currentStepTitle = computed(() => {
	if (step.value === 1) return "输入 Minecraft 用户名"
	if (step.value === 2) return "绑定 QQ 号"
	if (step.value === 3) return "设置登录密码"
	return "完成自助核验"
})

const currentStepDescription = computed(() => {
	if (step.value === 1) return "用于服务器白名单、玩家资料和社区身份展示。"
	if (step.value === 2) return "用于 QQ 群内验证和后续账户绑定。"
	if (step.value === 3) return "请设置一个至少 8 位的登录密码。"
	return "请选择当前已开放的验证方式；Chamber 世界测试暂未开放。"
})

const selectedMinecraftMethod = computed(() =>
	verificationMethods.value.find(method => method.id === "minecraft")
)

const minecraftServerAddress = computed(() =>
	selectedMinecraftMethod.value?.serverAddress || "qoriginal.vip"
)

const minecraftStateLabel = computed(() => {
	if (minecraftState.value === "pending") return "等待进入测试服务器"
	if (minecraftState.value === "claimed") return "测试进行中"
	if (minecraftState.value === "completed" && minecraftPassed.value) return "测试通过，正在注册"
	if (minecraftState.value === "completed") return "测试未通过"
	return "正在创建测试请求"
})

const minecraftExpiryText = computed(() => {
	if (!minecraftExpiresAt.value) return ""
	return new Date(minecraftExpiresAt.value).toLocaleTimeString("zh-CN", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	})
})

const primaryActionLabel = computed(() => {
	if (step.value <= 3) return isDevMode ? "下一步（开发模式跳过校验）" : "下一步"
	if (selectedVerificationMethod.value === "minecraft") {
		if (minecraftSessionId.value) return "等待世界测试完成"
		return isLoading.value ? "正在创建测试请求" : "创建世界测试请求"
	}
	return isLoading.value ? "正在创建答题会话" : "我已知悉上述内容，参与测试"
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
	const baseMessage = data.message || error?.message || "暂时无法创建答题会话，请稍后重试。"

	if (code !== "quiz_session_capacity_reached") return baseMessage

	const details = []
	if (Number.isInteger(data.activeSessions) && Number.isInteger(data.limit)) {
		details.push(`当前有效会话：${data.activeSessions} / ${data.limit}。`)
	}
	if (Number.isFinite(data.sessionTtlSeconds) && data.sessionTtlSeconds > 0) {
		const ttlMinutes = Math.ceil(data.sessionTtlSeconds / 60)
		details.push(`单个会话最长保留 ${ttlMinutes} 分钟，请稍后重试。`)
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
			message.value = "当前没有可用的账户验证方式，请稍后再试。"
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
			message.value = "Minecraft 用户名须为 3–16 位，只能包含英文字母、数字和下划线。"
			return
		}
		if (!isDevMode && await validateUsername(username.value)) {
			message.value = "用户名已被占用"
			return
		}
		step.value++
	} else if (step.value === 2) {
		if (!isDevMode && !validateQQ()) {
			message.value = "请输入正确的 QQ 号"
			return
		}
		step.value++
	} else if (step.value === 3) {
		if (!isDevMode && password.value.length < 8) {
			message.value = "密码长度不能少于 8 位"
			return
		}
		if (!isDevMode && password.value !== confirmPassword.value) {
			message.value = "两次输入的密码不一致"
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
			throw new Error("服务端未返回有效题目。")
		}
		if (!Number.isInteger(session.questionCount) || !Number.isInteger(session.passingScore)) {
			throw new Error("服务端未返回有效的题目数量或通过分数。")
		}
		if (session.questionCount !== session.questions.length) {
			throw new Error("服务端返回的题目数量不一致。")
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
			throw new Error("服务端未返回有效的 Minecraft 测试会话。")
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
			message.value = "Minecraft 世界测试未通过，请重新创建测试请求后再试。"
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
			isDialogVisible.value = true
		} else {
			message.value = result.message || "注册失败，请检查信息是否已被使用"
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
