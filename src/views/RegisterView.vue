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
						<input v-model="password" type="password" placeholder="设置密码" autocomplete="new-password" required />
					</label>

					<label v-if="step === 3" class="field">
						<span>确认密码</span>
						<input v-model="confirmPassword" type="password" placeholder="再次输入密码" autocomplete="new-password" required />
					</label>

					<div v-if="step === 4" class="quiz-intro">
						<p>为保证服务器秩序，Quantum Original 只接受初中含在读及以上学历，或具备一定文化常识与文字理解能力的玩家。</p>
						<p>测试共 9 道选择题。答对 6 题方为通过。</p>
						<p>测试通过后，请返回 QQ 群输入相应的 `.approve-register &lt;参数&gt;` 完成绑定验证。</p>
					</div>

					<p v-if="message && step <= 3" class="message">{{ message }}</p>

					<button type="submit" class="primary-button" :disabled="isLoading">
						<span v-if="isLoading" class="spinner"></span>
						{{ primaryActionLabel }}
					</button>
				</form>

				<div v-else-if="step === 4 && quiz_seq <= 8" :key="`quiz-${quiz_seq}`" class="quiz-section">
					<div class="quiz-window">
						<div>
							<h3>{{ questions[quiz_seq] }}</h3>
						</div>
					</div>

					<div class="quiz-meta">
						<span>剩余 {{ countdown }} 秒</span>
						<button v-if="quiz_seq === 0" type="button" class="secondary-button" @click="switchPage">跳过等待</button>
					</div>

					<div class="options" v-if="quiz_seq >= 0 && quiz_seq <= 8">
						<button type="button" @click="selectAnswer(0)">{{ optionA[quiz_seq] }}</button>
						<button type="button" @click="selectAnswer(1)">{{ optionB[quiz_seq] }}</button>
						<button type="button" @click="selectAnswer(2)">{{ optionC[quiz_seq] }}</button>
						<button type="button" @click="selectAnswer(3)">{{ optionD[quiz_seq] }}</button>
					</div>
				</div>

				<div v-else-if="quiz_seq >= 9" :key="`result-${quiz_seq}`" class="result-panel">
					<p v-if="quiz_seq === 9 && score < 6" class="message">您的得分为 {{ score }} / 9 分，不合格，请联系管理员并附上证明材料。</p>
					<p v-if="quiz_seq === 9 && score >= 6" class="quiz-success">您的得分为 {{ score }} / 9 分，合格，{{ countdown }} 秒后自动为您注册。</p>
					<p v-if="quiz_seq === 10"><span v-if="isLoading" class="spinner"></span>正在注册</p>
				</div>
			</Transition>

			<div class="panel-actions" v-if="step === 4 && quiz_seq === -1">
				<button type="button" class="secondary-button" @click="submitForm" :disabled="isLoading">
					<span v-if="isLoading" class="spinner"></span>
					我拒绝参加测试并直接注册，会向管理员提交证明材料
				</button>
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
import {computed, onBeforeUnmount, ref} from "vue";
import {useRouter} from "vue-router";
import {get} from "/src/utils/request";

const step = ref(1)
const quiz_seq = ref(-1)
const username = ref("")
const qq = ref("")
const password = ref("")
const confirmPassword = ref("")
const isDialogVisible = ref(false)
const message = ref("")
const isLoading = ref(false)
const countdown = ref(80)
const router = useRouter()
const isDevMode = import.meta.env.DEV
let countdownTimer = null
const pageTime = [15, 15, 15, 15, 20, 25, 25, 30, 50]
const answer = [1, 2, 0, 2, 0, 3, 2, 2, 3]
const questions = [
  "1.\t关于单位正方形，说法错误的是：",
  "2.\t以下哪个数不属于质数？",
  "3.\t以下哪个单词所代表的物品不与其余三个同类？",
  "4.\t昔人已乘黄鹤去，__________。",
  "5.\t关于“力”，以下说法<b>最不恰当</b>的一项是？",
  "6.\t以下物质在常温常压下能发生反应的是？",
  "7.\t过 (0,0), (4,0) 且二次项系数大于 0 的二次函数一定不经过？",
  "8.\t以下选项中的两个人物出自不同神话体系的是？",
  "9.\t将电动机与一 5Ω 电阻串联接入 20V 无内阻直流电源，电动机正常工作，使 5N 重物以 2.5m/s 匀速上升。若电阻电压为 8V，则电动机效率约为？"
]
const optionA = [
  "A. 有 4 条边",
  "A. 2",
  "A. peach",
  "A. 白云千载空悠悠",
  "A. 4N 的力与 3N 的力将合成为 7N 的力",
  "A. 胆矾和蒸馏水",
  "A. 第一象限",
  "A. 阿克琉斯、奥德赛",
  "A. 0.732"
]
const optionB = [
  "B. 每条对边均相互垂直",
  "B. 17",
  "B. giraffe",
  "B. 猿猱欲渡愁攀援",
  "B. 总是成对出现，作用在不同物体上",
  "B. 稀盐酸和石英",
  "B. 第二象限",
  "B. 西西弗斯、普罗米修斯",
  "B. 0.594"
]
const optionC = [
  "C. 面积为 1",
  "C. 35",
  "C. monkey",
  "C. 此地空余黄鹤楼",
  "C. 作用力的物体与受力的物体不一定接触",
  "C. 银和稀硫酸",
  "C. 第三象限",
  "C. 摩西、宙斯",
  "C. 0.711"
]
const optionD = [
  "D. 每个顶点形成的角均为 90 度",
  "D. 23",
  "D. fish",
  "D. 我欲因之梦江陵",
  "D. 重力由地球提供",
  "D. 铁和硫酸铜溶液",
  "D. 第四象限",
  "D. 伊什塔尔、吉尔伽美什",
  "D. 0.638"
]
const score = ref(0)

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
	if (step.value === 3) return "请设置一个至少 4 位的登录密码。"
	return "完成阅读测试，或选择向管理员提交证明材料。"
})

const primaryActionLabel = computed(() => {
	if (step.value <= 3) return isDevMode ? "下一步（开发模式跳过校验）" : "下一步"
	return "我已知悉上述内容，参与测试"
})

function validateQQ() {
	qq.value = qq.value.replace(/\D/g, "")
	return /^\d{5,12}$/.test(qq.value)
}


async function validateUsername() {
	const url = `https://api.qoriginal.vip/qo/download/registry?name=${username.value}`
	const res = await fetch(url).then(r => r.json()).catch(() => null)
	return res && res.data?.code === 1
}
async function handleNext() {
	message.value = ""

	if (step.value === 1) {
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
		if (!isDevMode && password.value.length < 4) {
			message.value = "密码长度不能少于 4 位"
			return
		}
		if (!isDevMode && password.value !== confirmPassword.value) {
			message.value = "两次输入的密码不一致"
			return
		}
		step.value++
	} else if (step.value === 4) {
		switchPage()
	}
}

function count() {
  countdown.value--
  if(countdown.value === 0) switchPage()
}

function switchPage() {
  quiz_seq.value++
  if (quiz_seq.value === 0 && !countdownTimer) countdownTimer = setInterval(count, 1000)
  if (quiz_seq.value <= 8) {
    countdown.value = pageTime[quiz_seq.value]
  } else if (quiz_seq.value === 9){
    countdown.value = 5
  } else {
    submitForm()
  }
}

function selectAnswer(idx) {
  let seq = quiz_seq.value
  if(idx === answer[seq]) score.value ++
  switchPage()
}

function submitForm() {
	if (isDevMode) {
		isDialogVisible.value = true
		return
	}

	isLoading.value = true
	const url = `https://api.glowingstone.cn/qo/upload/registry?name=${username.value}&password=${password.value}&uid=${qq.value}&score=${score.value}`

	get(url)
		.then(result => {
			if (result.code === 0) {
				isDialogVisible.value = true
			} else {
				message.value = "注册失败，请检查信息是否已被使用"
			}
		})
		.catch(() => {
			message.value = "请求失败，请稍后再试"
		})
		.finally(() => {
			isLoading.value = false
		})
}

function closeDialog() {
	isDialogVisible.value = false
	router.push("/")
}

onBeforeUnmount(() => {
	if (countdownTimer) clearInterval(countdownTimer)
})

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
.quiz-window {
	overflow-y: auto;
	max-height: min(42vh, 420px);
	border: 1px solid var(--register-border);
	padding: 1rem;
	color: var(--text-main);
	background: var(--background-secondary);
	line-height: 1.7;
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

	.quiz-meta {
		flex-direction: column;
		align-items: stretch;
	}

	.quiz-meta .secondary-button {
		width: 100%;
	}
}
</style>
