<template>
	<div class="login-wrapper">
		<div class="login-panel">
			<h3 v-if="quiz_seq === -1 || quiz_seq >= 9">第 {{ step }} / 4 步</h3>
			<h2 v-if="step === 1">输入您的 Minecraft 用户名</h2>
			<h2 v-if="step === 2">输入您的 QQ 号</h2>
			<h2 v-if="step === 3">设置您的密码</h2>
      <h2 v-if="step === 4 && (quiz_seq === -1 || quiz_seq >= 9)">完成年龄认证 - 初中文化水平自助核验测试</h2>

			<form @submit.prevent="handleNext">
				<input
					v-if="step === 1"
					type="text"
					placeholder="Minecraft 用户名"
					v-model="username"
					required
				/>
				<input
					v-if="step === 2"
					type="text"
					placeholder="QQ 号"
					v-model="qq"
					@input="validateQQ"
					required
				/>
				<input
					v-if="step === 3"
					type="password"
					placeholder="设置密码"
					v-model="password"
					required
				/>

				<p class="message" v-if="step <= 3">{{ message }}</p>
        <p class="message" v-if="quiz_seq === 9 && score < 6">您的得分为 {{score}} / 8 分，不合格，请联系管理员并附上证明材料。</p>
        <p class="quiz-success" v-if="quiz_seq === 9 && score >= 6">您的得分为 {{score}} / 8 分，合格，{{countdown}} 秒后自动为您注册。</p>
        <p v-if="quiz_seq === 10"><span v-if="isLoading" class="spinner"></span>正在注册</p>

        <div v-if="step === 4 && quiz_seq <= 8" class="quiz-window">
          <div v-if="quiz_seq === -1">
            <p>1. 为保证服务器的正常秩序，Quantum Original只接受初中（含在读）及以上学历的玩家或处于初中学段以下但具有一定文化素养和文字理解能力的玩家。玩家可通过参加该测试或向服主或管理员提供相关证明材料进行满足上述条件的证明。</p>
            <p>2. 本套题目共1个简体中文语篇，8道选择题。其中语篇阅读时间80秒，第1-4题限时20秒完成，第5-7题限时30秒完成，第8题限时50秒完成，总时长5分钟，答对6题方为通过。</p>
            <p>3. 测试通过后，请返回QQ群输入相应的 /approve-register &lt;参数&gt; 完成玩家绑定验证；测试不通过者，该QQ号的持有者不得再次参与考试，须向服主或管理员提供证明材料才可参与游戏。</p>
          </div>
          <div v-else>
            <h4>主城北机场正式落成，有望促进区域间协同</h4>
            &emsp;&emsp;夜幕来临，阿弥诺斯大陆华灯盏盏，从飞机上向下俯瞰，整个大陆如同地上散落的星河。（甲）近日，一幅玩家在从主城飞往锡城的途中从飞机舷窗外拍摄主城夜景的照片在QO社区中广受好评。
            <br/>&emsp;&emsp;这幅璀璨的星图的右前方，有一颗被称作主城北站的亮星。该站始建于2023年，系G3线蓝冰化改造后新建的终点站。由于其南临主城核心区，北有海洋的独特地理禀赋，历经多次改造，主城北站已成为铁路联通全物品分类机、末地门，蓝冰高速联通出生点和锡城，并即将开通接入6号线的一级站，既满足了新人前往主城发展的需求，又保障了主城和锡城两个片区人群的往来，日平均客流量稳居全服第一。
            <br/>&emsp;&emsp;（乙）正值主城北片区改造工程之际，由Wsiogn领衔的QO玩家通过炸山平地的方式，在主城北北面开创性地设计并制造了第1座机场，解决了主城北站无法进行大于5千米的旅行的“硬伤”，使得主城北跃升为第1座空铁船三用的综合性交通枢纽，有望在不久的将来联通阿弥诺斯大陆与芙岛。
            <br/>&emsp;&emsp;芙岛原住民Anonymous表示：“作为芙岛的先驱者，对于交通方式的飞跃，我感到无比欣喜与期待。大力发展芙岛交通产业，有助于提高居民收入，带动经济发展。空运对于芙岛的哞菇产业有着不可替代的作用，有助于芙岛整只出口哞菇，打响产业品牌。展望未来，我相信芙岛定能在空中航线开通之后，发展为宜居宜行的主城‘卫星城’！”（丙）
            <br/>&emsp;&emsp;但以MineCreeper为代表的玩家表示，设立机场这一举措有华而不实之嫌。在现实世界中，我们确实没有办法找到像飞机一样快速便捷的旅行工具，但在游戏世界中，受限于机场数量和场地大小的限制，其便捷性远不如鞘翅。同时，客观上来说，游戏内几乎同一时期兴建的珍珠炮可以以几乎为零的时间成本穿梭于各大分散的玩家聚集区或功能区，这是飞机等交通工具不能媲美的。
            <br/>&emsp;&emsp;不过，我们依然需要肯定，正如Anonymous提到的那样，机场的开通提供了一种稳定且快速的运输实体的方式，这是任何一种已有的交通方式都难以实现的短板。（丁）交通的进步不仅带来各产业区域加强资源调配与合作的可能，更打破了各大玩家聚集区之间的地理隔阂，为打造一个货物互联、资源互补、经济互助、民心相通的Quantum Original铸造了更多机遇。
          </div>
        </div>
        <div v-if="step === 4 && quiz_seq >= 1">
          <p>{{questions[quiz_seq-1]}}</p>
        </div>
        <p v-if="quiz_seq === 8">事实上，机场只是服务器大力推进交通建设的一个缩影。服务器自研的矿车高速化和闭塞区段插件极大地解决了原版服务器中矿车速度过慢的“鸡肋”问题，弥补了骑马与蓝冰船之间的旅速空白。就是这些微小的努力累加起来，才能使得Quantum Original成为交通强服。</p>
				<button type="submit" :disabled="isLoading" v-if="quiz_seq === -1">
					<span v-if="isLoading" class="spinner"></span>
					<span v-if="step <= 3">下一步</span>
          <span v-if="step === 4">我已知悉上述内容，参与测试</span>
				</button>
			</form>
      <button v-if="step === 4 && quiz_seq === -1" @click="submitForm" :disabled="isLoading"><span v-if="isLoading" class="spinner"></span><span>我拒绝参加测试并直接注册，会向管理员提交证明材料</span></button>
      <button v-if="step === 4 && quiz_seq === 0" @click="switchPage"><span>跳过等待</span></button>
      <div class="options" v-if="quiz_seq >= 1 && quiz_seq <= 8">
        <button @click="()=>{selectAnswer(0)}">{{optionA[quiz_seq-1]}}</button>
        <button @click="()=>{selectAnswer(1)}">{{optionB[quiz_seq-1]}}</button>
        <button @click="()=>{selectAnswer(2)}">{{optionC[quiz_seq-1]}}</button>
        <button @click="()=>{selectAnswer(3)}">{{optionD[quiz_seq-1]}}</button>
      </div>
      <p v-if="quiz_seq >= 0 && quiz_seq <= 8">本页阅读时间剩余 <span>{{countdown}}</span> 秒</p>
			<p>注册QO账号即代表您已经阅读并且同意<a href="https://qoriginal.vip/docs#/things_to_know">用户须知</a>。</p>
		</div>

		<div v-if="isDialogVisible" class="dialog-overlay">
			<div class="dialog">
				<h2>注册成功！</h2>
				<h4>欢迎加入 QOriginal！请在QQ群中发送确认信息（/approve-register <>）来激活您的账户。</h4>
				<button @click="closeDialog">确认</button>
			</div>
		</div>
	</div>
</template>


<script setup>
import {onBeforeUnmount, onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import {get} from "/src/utils/request";
import {usePageStore} from "@/utils/store.ts";

const step = ref(1)
const quiz_seq = ref(-1)
const username = ref("")
const qq = ref("")
const password = ref("")
const isDialogVisible = ref(false)
const message = ref("")
const isLoading = ref(false)
const countdown = ref(80)
const router = useRouter()
const pageStore = usePageStore()
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
		if (await validateUsername(username.value)) {
			message.value = "用户名已被占用"
			return
		}
		step.value++
	} else if (step.value === 2) {
		if (!validateQQ()) {
			message.value = "请输入正确的 QQ 号"
			return
		}
		step.value++
	} else if (step.value === 3) {
		if (password.value.length < 4) {
			message.value = "密码长度不能少于 4 位"
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
  if (quiz_seq.value === 0) setInterval(count, 1000)
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

</script>

<style scoped>
.login-wrapper {
	height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
}

.login-panel {
	padding: 8rem;
	border-radius: 20px;
	width: 100%;
	max-width: 700px;
	text-align: left;

	h2, h3 {
		color: white;
	}

	h2 {
		font-size: 1.8rem;
	}

	h3 {
		font-size: 1.6rem;
	}
}

input {
	padding: 1rem 1.4rem;
	margin: 0.3rem 0;
	border: 2px solid #ccc;
	border-radius: 35px;
	background: none;
	font-size: 1rem;
	color: white;
}

button {
	width: 100%;
	padding: 1rem;
	background: #2063a9;
	color: white;
	border: none;
	border-radius: 10px;
	font-size: 1.1rem;
	cursor: pointer;
  margin-bottom: 1em;
}

.options button {
  flex: 0 0 48%;
}

.options {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

.message {
	color: #ff4757;
	font-size: 0.9rem;
	min-height: 1rem;
}

.quiz-success {
  color: #7bff47;
  font-size: 0.9rem;
  min-height: 1rem;
}

.spinner {
	border: 3px solid white;
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
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
}

.quiz-window {
  overflow-y: auto;
  height: 40vh;
  border-radius: 5px;
  padding: 10px;
  border: 1px solid white;
  margin-bottom: 2em;
  color: white;
}

.dialog {
	background: white;
	padding: 2rem;
	border-radius: 20px;
	max-width: 500px;
}
p {
	color: white;
}
a{
	color: white;
}
</style>
