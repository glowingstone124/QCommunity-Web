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
						<p>为保证服务器秩序，Quantum Original 只接受初中含在读及以上学历，或具备一定文字理解能力的玩家。</p>
						<p>测试共 1 个阅读语篇、8 道选择题。答对 6 题方为通过。</p>
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
						<div v-if="quiz_seq === 0">
							<h3>阅读材料</h3>
							<p>夜幕来临，阿弥诺斯大陆华灯盏盏，从飞机上向下俯瞰，整个大陆如同地上散落的星河。（甲）近日，一幅玩家在从主城飞往锡城的途中从飞机舷窗外拍摄主城夜景的照片在 QO 社区中广受好评。</p>
							<p>这幅璀璨的星图的右前方，有一颗被称作主城北站的亮星。该站始建于 2023 年，系 G3 线蓝冰化改造后新建的终点站。由于其南临主城核心区，北有海洋的独特地理禀赋，历经多次改造，主城北站已成为铁路联通全物品分类机、末地门，蓝冰高速联通出生点和锡城，并即将开通接入 6 号线的一级站。</p>
							<p>（乙）正值主城北片区改造工程之际，由 Wsiogn 领衔的 QO 玩家通过炸山平地的方式，在主城北北面开创性地设计并制造了第 1 座机场，解决了主城北站无法进行大于 5 千米旅行的短板。</p>
							<p>芙岛原住民 Anonymous 表示，空运对于芙岛的哞菇产业有着不可替代的作用，有助于芙岛整只出口哞菇，打响产业品牌。（丙）但以 MineCreeper 为代表的玩家表示，设立机场这一举措有华而不实之嫌。</p>
							<p>不过，机场的开通提供了一种稳定且快速的运输实体的方式，这是任何一种已有的交通方式都难以实现的短板。（丁）交通的进步为打造一个货物互联、资源互补、经济互助、民心相通的 Quantum Original 铸造了更多机遇。</p>
						</div>
						<div v-else>
							<h3>{{ questions[quiz_seq - 1] }}</h3>
							<p v-if="quiz_seq === 8">事实上，机场只是服务器大力推进交通建设的一个缩影。服务器自研的矿车高速化和闭塞区段插件极大地解决了原版服务器中矿车速度过慢的问题。</p>
						</div>
					</div>

					<div class="quiz-meta">
						<span>剩余 {{ countdown }} 秒</span>
						<button v-if="quiz_seq === 0" type="button" class="secondary-button" @click="switchPage">跳过等待</button>
					</div>

					<div class="options" v-if="quiz_seq >= 1 && quiz_seq <= 8">
						<button type="button" @click="selectAnswer(0)">{{ optionA[quiz_seq - 1] }}</button>
						<button type="button" @click="selectAnswer(1)">{{ optionB[quiz_seq - 1] }}</button>
						<button type="button" @click="selectAnswer(2)">{{ optionC[quiz_seq - 1] }}</button>
						<button type="button" @click="selectAnswer(3)">{{ optionD[quiz_seq - 1] }}</button>
					</div>
				</div>

				<div v-else-if="quiz_seq >= 9" :key="`result-${quiz_seq}`" class="result-panel">
					<p v-if="quiz_seq === 9 && score < 6" class="message">您的得分为 {{ score }} / 8 分，不合格，请联系管理员并附上证明材料。</p>
					<p v-if="quiz_seq === 9 && score >= 6" class="quiz-success">您的得分为 {{ score }} / 8 分，合格，{{ countdown }} 秒后自动为您注册。</p>
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
const pageTime = [80, 20, 20, 20, 20, 30, 30, 30, 50]
const answer = [-1, 1, 2, 0, 3, 0, 3, 2, 3]
const questions = [
  "1.\t建造主城北机场采用了下列哪个工艺？",
  "2.\t以下哪一个人对机场的设立采取了批判态度？",
  "3.\t以下哪一个地点不能通过不乘坐飞机的方式从主城北直接到达？",
  "4.\t主城北枢纽可用的交通方式不包括下列哪个？",
  "5.\t以下哪种货物最适合通过飞机运输？",
  "6.\t描写飞机俯瞰阿弥诺斯大陆的意图不包括下列哪个？",
  "7.\t下列说法正确的是？",
  "8.\t如果要插入以下内容，最适合插入在哪一个位置？"
]
const optionA = [
  "A. 填海造陆",
  "A. Wsiogn",
  "A. 芙岛",
  "A. 铁路",
  "A. 热带猪",
  "A. 展示大陆的美丽夜景",
  "A. 飞机是服务器中长途运输实体的唯一方式",
  "A. (甲)"
]
const optionB = [
  "B. 夷山平地",
  "B. Anonymous",
  "B. 末地门",
  "B. 飞机",
  "B. 寒带鸡",
  "B. 暗示主城的新建机场",
  "B. 芙岛已经成为主城重要的\"卫星城\"之一",
  "B. (乙)"
]
const optionC = [
  "C. 珍珠炮炸山",
  "C. MineCreeper",
  "C. 全物品分类机",
  "C. 蓝冰船",
  "C. 末影水晶",
  "C. 引出主城北站的介绍",
  "C. 珍珠炮是目前实现玩家长途旅行的最优解",
  "C. (丙)"
]
const optionD = [
  "D. 铁路建设",
  "D. Quantum Original",
  "D. 锡城",
  "D. 珍珠炮",
  "D. 潜影盒",
  "D. 描摹大陆星空的壮美",
  "D. 6号线的开通将使得主城北能够联通芙岛",
  "D. (丁)"
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
	background:
		linear-gradient(180deg, color-mix(in srgb, var(--background) 86%, #0f172a), color-mix(in srgb, var(--background) 94%, #0f172a)),
		color-mix(in srgb, var(--background-secondary) 78%, #0f172a);
	color: var(--text-main);
	padding: clamp(1rem, 5vw, 4rem);
	box-sizing: border-box;
	overflow: auto;
}

:global(:root[data-theme='dark']) .register-page {
	--register-border: color-mix(in srgb, var(--dark-text-primary) 18%, transparent);
	background:
		linear-gradient(180deg, color-mix(in srgb, var(--background) 76%, #0f172a), color-mix(in srgb, var(--background) 88%, #0f172a)),
		color-mix(in srgb, var(--background-secondary) 68%, #0f172a);
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
