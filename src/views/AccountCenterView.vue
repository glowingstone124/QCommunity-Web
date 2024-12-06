<script setup>
import RedirectButton from "@/components/RedirectButton.vue";
import {onMounted, ref, watch} from "vue";

const currentSetting = ref(0);
const username = ref("");
const uid = ref(0);
const playtime = ref(0);
const logins = ref([])
function displayCurrentSetting(label) {
	currentSetting.value = label;
}
function formatDate(timestamp) {
	const date = new Date(timestamp);
	return date.toLocaleString();
}

function queryAccountData() {
	fetch("https://api.qoriginal.vip/qo/authorization/account", {
		headers: {
			"token": localStorage.getItem("token"),
		}
	}).then(res => res.json())
		.then(data => {
			console.log(data);
			username.value = data.username;
			uid.value = data.uid;
			playtime.value = data.playtime;
			logins.value = data.logins;
		});
}
onMounted(() => {
	queryAccountData();
})

watch(currentSetting, (newValue) => {
	if (newValue === 0) {
		queryAccountData();
	}
});
</script>


<template>
	<div class="container">
		<div class="right">
			<span>
				<h1>账户中心</h1>
				<RedirectButton text-color="#89e88b"/>
			</span>
			<span class="navigate-menu">
				<div class="navigate-items" @click="displayCurrentSetting(0)">
					<h2>账户信息</h2>
				</div>
				<div class="navigate-items" @click="displayCurrentSetting(1)">
					<h2>更改密码</h2>
				</div>
				<div class="navigate-items" @click="displayCurrentSetting(2)">
					<h2>其他</h2>
				</div>
			</span>
		</div>

		<div class="left">
			<transition name="slide-in">
				<div v-if="currentSetting === 0" key="account-info" class="panel-wrapper">
					<div class="brief-info">
						<h2>账户信息</h2>
						<p>了解你的账户详情</p>
					</div>
					<div class="panel">
						<div class="username">
							<h2>欢迎，{{ username }}</h2>
							<h3>您已经游玩了<span class="time">{{playtime}}</span>分钟</h3>
						</div>
						<h3 class="subtitle">登录历史</h3>
						<div v-for="(login, index) in logins" :key="index" class="login-record">
							<p>登录时间：{{ formatDate(login.date) }}</p>
							<p>登录结果：{{ login.success ? '成功' : '失败' }}</p>
						</div>
					</div>
				</div>
			</transition>
			<transition name="slide-in">
				<div v-if="currentSetting === 1" key="change-password">
					<div class="brief-info">
						<h2>更改密码</h2>
						<p>这里是更改密码的表单。</p>
					</div>
				</div>
			</transition>
			<transition name="slide-in">
				<div v-if="currentSetting === 2" key="other-info">
					<div class="brief-info">
						<h2>其他</h2>
						<p>这里是其他信息展示。</p>
					</div>
				</div>
			</transition>
		</div>
	</div>
</template>


<style scoped>
@import "/src/assets/base.css";
@import "/src/assets/main.css";
.panel-wrapper {
	display: flex;
	flex-direction: row;
	width: 100%;
	height: 100%;
}
.login-record {
	border-radius: 20px;
	background-color: rgb(61, 100, 101);
	padding: 10px 20px;
}
.brief-info {
	h2 {
		color: #54ab54;
		font-weight: 400;
		font-size: 3.2rem;
	}

	align-items: center;
	justify-content: center;
	display: flex;
	flex-direction: column;
	flex: 3;
}

.panel {
	flex: 7;
}

p, h2, ul, li {
	color: var(--text);
}

h1 {
	font-size: 3rem;
	font-weight: 500;
	color: #89e88b;
}

.container {
	height: 100%;
	width: 100%;
	display: flex;
	flex-direction: row
}
.subtitle {
	font-size: 2rem;
	color: #c9fac9;
}

.username {
	h2 {
		font-size: 2.1rem;
	}
	h2, h3{
		font-family: Bahnschrift;
	}
	.time {
		font-size: 2rem;
	}
	h3 {
		color: #76d0ef;
	}
}

.right {
	background: rgb(39, 64, 65);
	flex: 3;
	margin: 2vw;
	padding: 50px;
	border-radius: 40px;
}

.navigate-items {
	background: rgb(61, 100, 101);
	padding: 2px 40px;
	width: 80%;
	display: flex;
	justify-content: center;
	margin-bottom: 20px;
	border-radius: 50px;

	h2 {
		font-size: 1.5rem;
		font-weight: 300;
		color: #aed3ae;
	}
}

.navigate-items:hover {
	cursor: pointer;
	background: rgb(84, 135, 136);
}

.left {

	background: rgb(39, 64, 65);
	flex: 7;
	margin: 2vw;
	padding: 50px 80px;
	border-radius: 40px;
}

.navigate-menu {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	width: 100%;
}

@media (max-width: 768px) {
	.container {
		flex-direction: column;
	}

	.panel-wrapper {
		flex-direction: column;

	}
}

.slide-in-enter-active {
	transition: all 0.5s ease;
}

.slide-in-enter-from {
	opacity: 0;
	transform: translateX(100px);
}

.slide-in-enter-to {
	opacity: 1;
	transform: translateX(0);
}

.slide-in-leave-active {
	display: none;
}
</style>
