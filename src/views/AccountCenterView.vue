<script setup>
import RedirectButton from "@/components/RedirectButton.vue";
import ArtCard from "@/components/ArtCard.vue";

import {onMounted, ref, watch} from "vue";

const currentSetting = ref(0);
const username = ref("");
const uid = ref(0);
const playtime = ref(0);
const logins = ref([])
const iplist = ref([])
const ipAddr = ref("")
const isValidIp = ref(false)
const isImmersive = ref(true)

import {alert, defaultModules} from '@pnotify/core';
import '@pnotify/core/dist/PNotify.css';
import '@pnotify/core/dist/BrightTheme.css';
import * as PNotifyMobile from '@pnotify/mobile';
import '@pnotify/mobile/dist/PNotifyMobile.css';
import PlayerCardsListComponent from "@/components/PlayerCardsListComponent.vue";


defaultModules.set(PNotifyMobile, {});

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

function submitIp() {
	fetch("https://api.qoriginal.vip/qo/authorization/ip/add?ip=" + ipAddr.value, {
		headers: {
			"token": localStorage.getItem("token"),
		}
	})
		.then(res => res.json())
		.then(data => {
			console.log(data);
			if (data.code === 1) {
				alert({text: '登录失效，请重新登陆'})
			}
			if (data.code === 2) {
				alert({text: '您最多只能注册五个ip'})
			}
			queryIpDetails()
		})
}

function queryIpDetails() {
	fetch("https://api.qoriginal.vip/qo/authorization/ip/query", {
		headers: {
			"token": localStorage.getItem("token"),
		}
	}).then(res => res.json())
		.then(data => {
			console.log(data);
			iplist.value = data
		})
}

const validateIP = () => {
	const ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
	isValidIp.value = ipPattern.test(ipAddr.value);
};
onMounted(() => {
	currentSetting.value = parseInt(localStorage.getItem('currentSetting'))
	queryAccountData();
})

watch(currentSetting, (newValue) => {
	localStorage.setItem('currentSetting', newValue)
	switch (newValue) {
		case 0:
			queryAccountData();
			isImmersive.value = true;
			break;
		case 1:
			isImmersive.value = true;
			queryIpDetails();
			break;
		case 2:
			isImmersive.value = false;
	}
});
</script>


<template>
	<div class="container">
		<div class="right">
			<span>
				<h1 style="margin-left: 2rem;">账户中心</h1>
			</span>
			<span class="navigate-menu">
				<div class="navigate-items" @click="displayCurrentSetting(0)" :class="[currentSetting === 0 ? 'active' : '']">
					<h2>账户信息</h2>
				</div>
				<div class="navigate-items" @click="displayCurrentSetting(1)" :class="[currentSetting === 1 ? 'active' : '']">
					<h2>IP过白</h2>
				</div>
				<div class="navigate-items" @click="displayCurrentSetting(2)" :class="[currentSetting === 2 ? 'active' : '']">
					<h2>个性化</h2>
				</div>
			</span>
		</div>

		<div class="left" v-bind:class="{hasBackground: isImmersive}">
			<transition name="slide-in">
				<div v-if="currentSetting === 0" key="account-info" class="panel-wrapper">
					<div class="panel">
						<h1 class="title">账户信息</h1>
						<div class="username">
							<h2>欢迎，{{ username }}</h2>
							<h3>您已经游玩了<span class="time">{{ playtime }}</span>分钟</h3>
						</div>
						<div class="hint">
							<span style="flex-direction: row; display: flex; align-items: center;">
								<img src="@/components/icons/lock.svg" alt="">
								<h2>账号安全</h2>
							</span>
							<p>您已经绑定到QQ: {{ uid }}</p>
						</div>
						<h3 class="subtitle">登录历史</h3>
						<div class="func">
							<div v-for="(login, index) in logins" :key="index" class="login-record">
								<p>登录时间：{{ formatDate(login.date) }}</p>
								<p>登录结果：{{ login.success ? '成功' : '失败' }}</p>
							</div>
						</div>
					</div>
				</div>
			</transition>
			<transition name="slide-in">
				<div v-if="currentSetting === 1" key="ip-whitelist" class="panel-wrapper">
					<div class="panel">
						<h1 class="title">IP过白</h1>
						<h3 class="subtitle">注册新的海外IP</h3>
						<div class="func">
							<input type="text" @input="validateIP" v-model="ipAddr" placeholder="请输入内容"/>
						</div>
						<div v-if="isValidIp">
							<button type="submit" class="btn" @click="submitIp">
								<span>提交</span>
							</button>
						</div>
						<h3 class="subtitle">已经注册的IP</h3>
						<div class="func">
							<div v-for="(ip) in iplist" class="ip-record">
								<p>{{ ip }}</p>
							</div>
						</div>
					</div>
				</div>
			</transition>
			<transition name="slide-in">
				<div v-if="currentSetting === 2" key="other-info" style="height: 100%;">
					<PlayerCardsListComponent></PlayerCardsListComponent>
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
	height: 100%;
  margin: 1rem 3rem;
}

input[type="text"],
input[type="password"] {
	margin: auto;
	padding: 25px;
	background-color: rgba(75, 91, 75, 0.42);
	border: none;
	border-bottom: #95c295 5px solid;
	font-size: 1rem;
}

input:focus {
	border-bottom-color: #5fb493;
}

.login-record {
	border-radius: 20px;
	background-color: rgb(61, 100, 101);
	padding: 10px 20px;
	margin-bottom: 20px;
}

.ip-record {
	border-radius: 20px;
	background-color: rgb(61, 100, 101);
	padding: 5px 2px;
	margin: 10px 20px;
	text-align: center;

	p {
		font-size: 1.3rem;
		font-family: monospace;
	}
}

.brief-info {
	h2 {
		color: #86c986;
		font-weight: 400;
		font-size: 2.5rem;
	}

	align-items: center;
	justify-content: center;
	display: flex;
	flex-direction: column;
	flex: 3;
}

.panel {
	flex: 7;
	overflow: auto;
	display: flex;
	flex-direction: column;
}

p, h2, ul, li {
	color: var(--text);
}

h1 {
	font-size: 3rem;
	font-weight: 500;
	color: #d4e7a9;
}

.container {
	height: 100%;
	max-width: 100vw;
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

	h2, h3 {
		font-family: Bahnschrift;
	}

	.time {
		font-size: 2rem;
	}

	h3 {
		color: #76d0ef;
	}
}
.title {
	color:#d4e7a9;
}
.right {
	padding: 2rem;
	padding-left: 0;
	flex: 2;
}

.left {
	flex: 8;
}

.navigate-items {
	width: 100%;
	display: flex;
	justify-content: left;
	padding-left: 3rem;
	border-bottom-right-radius: 20px;
	border-top-right-radius: 20px;
	h2 {
		font-size: 1.2rem;
		font-weight: 300;
		color: #d4e7a9;
		margin-top: 10px;
	}
}

.navigate-items.active {
	background: rgb(84, 135, 136);
}

.navigate-items:hover {
	cursor: pointer;
	background: rgb(84, 135, 136);
}

.hasBackground {
	background: #3b4444;
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
		overflow: scroll;
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

.func {
}

.btn {
	margin: 20px 0;
	border: none;
	padding: 10px 30px;
	background: #4b7a4f;
	border-radius: 20px;
}

.btn:hover {
	background: #59935e;
}

.hint {
	margin: 1px auto;
	background-color: #4a557c;
	border-radius: 20px;
	padding: 5px 25px;
	min-width: 70%;
	display: flex;
	flex-direction: column;

	img {
		height: 50%;
	}

	h2, p {
		color: #ffffff;
	}

	h2 {
		margin: 7px;
	}
}
</style>
