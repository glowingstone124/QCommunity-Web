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
const isFrozen = ref(null)
const statusHint = ref("")

import {alert, defaultModules} from '@pnotify/core';
import '@pnotify/core/dist/PNotify.css';
import '@pnotify/core/dist/BrightTheme.css';
import * as PNotifyMobile from '@pnotify/mobile';
import '@pnotify/mobile/dist/PNotifyMobile.css';
import PlayerCardsListComponent from "@/components/PlayerCardsListComponent.vue";
import AffiliatedAccountComponent from "@/components/AffiliatedAccountComponent.vue";


defaultModules.set(PNotifyMobile, {});

function displayCurrentSetting(label) {
	currentSetting.value = label;
}

function formatDate(timestamp) {
	const date = new Date(timestamp);
	return date.toLocaleString();
}

function queryAccountData() {
	fetch("/api/qo/authorization/account", {
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
			queryAccountStatus();
		});
}

function queryAccountStatus() {
	if (!username.value) {
		return;
	}
	isFrozen.value = null;
	statusHint.value = "检测中";
	fetch(`https://api.glowingstone.cn/qo/download/registry?name=${encodeURIComponent(username.value)}`)
		.then(res => res.json())
		.then(data => {
			if (data.code === 1) {
				isFrozen.value = null;
				statusHint.value = "未查询到账号";
				return;
			}
			isFrozen.value = data.frozen === true;
			statusHint.value = isFrozen.value ? "冻结" : "正常";
		})
		.catch(() => {
			isFrozen.value = null;
			statusHint.value = "查询失败";
		});
}

function submitIp() {
	fetch("/api/qo/authorization/ip/add?ip=" + ipAddr.value, {
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
	fetch("/api/qo/authorization/ip/query", {
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
	const storedSetting = Number.parseInt(localStorage.getItem('currentSetting'), 10);
	currentSetting.value = Number.isNaN(storedSetting) ? 0 : storedSetting;
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
			break;
		case 3:
			isImmersive.value = false;
			break;
	}
});
</script>


<template>
	<div class="account">
		<aside class="side">
			<div class="side-header">
				<p class="eyebrow">Account</p>
				<h1>账户中心</h1>
				<p class="side-sub">集中管理账户、登录安全与个性化配置</p>
			</div>
			<nav class="nav">
				<button type="button" class="nav-item" @click="displayCurrentSetting(0)" :class="[currentSetting === 0 ? 'active' : '']">
					<span class="nav-title">账户信息</span>
					<span class="nav-desc">概览与登录历史</span>
				</button>
				<button type="button" class="nav-item" @click="displayCurrentSetting(1)" :class="[currentSetting === 1 ? 'active' : '']">
					<span class="nav-title">IP过白</span>
					<span class="nav-desc">海外登录白名单</span>
				</button>
				<button type="button" class="nav-item" @click="displayCurrentSetting(2)" :class="[currentSetting === 2 ? 'active' : '']">
					<span class="nav-title">个性化</span>
					<span class="nav-desc">名片与展示外观</span>
				</button>
				<button type="button" class="nav-item" @click="displayCurrentSetting(3)" :class="[currentSetting === 3 ? 'active' : '']">
					<span class="nav-title">附属账户</span>
					<span class="nav-desc">管理绑定账户</span>
				</button>
			</nav>
			<div class="side-foot">
				<div class="tip-card">
					<p class="tip-title">安全提示</p>
					<p class="tip-desc">建议定期查看登录历史，发现异常立即修改密码。</p>
				</div>
			</div>
		</aside>

		<main class="content" :class="{ immersive: isImmersive }">
			<transition name="slide-in">
				<section v-if="currentSetting === 0" key="account-info" class="panel">
					<header class="panel-header">
						<div>
							<h2 class="panel-title">账户信息</h2>
							<p class="panel-sub">近况、统计与安全信息一览</p>
						</div>
						<span class="pill">绑定 QQ · {{ uid || '—' }}</span>
					</header>
					<div class="stats">
						<div class="stat-card">
							<p class="stat-label">用户名</p>
							<p class="stat-value">{{ username || '—' }}</p>
						</div>
						<div class="stat-card">
							<p class="stat-label">累计游玩</p>
							<p class="stat-value"><span class="stat-num">{{ playtime }}</span> 分钟</p>
						</div>
						<div class="stat-card">
							<p class="stat-label">登录次数</p>
							<p class="stat-value">{{ logins.length }}</p>
						</div>
						<div class="stat-card">
							<p class="stat-label">账号状态</p>
							<p class="stat-value" :class="isFrozen ? 'status-frozen' : 'status-ok'">
								{{ statusHint || '检测中' }}
							</p>
						</div>
					</div>
					<div class="section">
						<div class="section-title">登录历史</div>
						<div class="record-grid" v-if="logins.length">
							<div
								v-for="(login, index) in logins"
								:key="index"
								class="login-record"
								:class="{ success: login.success, fail: !login.success }"
							>
								<h2>{{ login.success ? '成功' : '失败' }}</h2>
								<p>{{ formatDate(login.date) }}</p>
							</div>
						</div>
						<p v-else class="empty">暂无登录记录。</p>
					</div>
				</section>
			</transition>
			<transition name="slide-in">
				<section v-if="currentSetting === 1" key="ip-whitelist" class="panel">
					<header class="panel-header">
						<div>
							<h2 class="panel-title">IP过白</h2>
							<p class="panel-sub">仅允许登记过的海外 IP 登录</p>
						</div>
						<span class="pill">最多 5 个</span>
					</header>
					<div class="section">
						<div class="section-title">注册新 IP</div>
						<div class="form-row">
							<input type="text" @input="validateIP" v-model="ipAddr" placeholder="例如：123.45.67.89"/>
							<button type="submit" class="btn" :disabled="!isValidIp" @click="submitIp">
								<span>提交</span>
							</button>
						</div>
						<p class="helper" :class="{ invalid: ipAddr && !isValidIp }">
							{{ ipAddr && !isValidIp ? 'IP 格式不正确，请检查后再提交。' : '请输入正确的 IPv4 地址。' }}
						</p>
					</div>
					<div class="section">
						<div class="section-title">已登记 IP</div>
						<div class="chip-grid" v-if="iplist.length">
							<div v-for="(ip) in iplist" class="ip-chip">
								<span>{{ ip }}</span>
							</div>
						</div>
						<p v-else class="empty">暂未登记 IP。</p>
					</div>
				</section>
			</transition>
			<transition name="slide-in">
				<section v-if="currentSetting === 2" key="personalization" class="panel panel-full">
					<PlayerCardsListComponent></PlayerCardsListComponent>
				</section>
			</transition>

			<transition name="slide-in">
				<section v-if="currentSetting === 3" key="affiliated" class="panel panel-full">
					<AffiliatedAccountComponent/>
				</section>
			</transition>
		</main>
	</div>
</template>


<style scoped>
@import "/src/assets/base.css";
@import "/src/assets/main.css";
@import "/src/assets/colors.css";
:global(:root) {
	--account-bg:
		radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 55%),
		radial-gradient(circle at 20% 10%, rgba(255, 186, 106, 0.25), transparent 45%),
		linear-gradient(160deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.95));
	--glass-strong: rgba(255, 255, 255, 0.75);
	--glass-soft: rgba(255, 255, 255, 0.85);
	--nav-bg: rgba(255, 255, 255, 0.7);
	--surface-soft: rgba(15, 23, 42, 0.05);
	--border-soft: rgba(15, 23, 42, 0.08);
	--dot-color: rgba(15, 23, 42, 0.08);
}

:global(:root[data-theme="dark"]) {
	--account-bg:
		radial-gradient(circle at 10% 10%, rgba(59, 130, 246, 0.15), transparent 55%),
		radial-gradient(circle at 80% 0%, rgba(244, 114, 182, 0.18), transparent 45%),
		linear-gradient(160deg, rgba(11, 18, 32, 0.98), rgba(15, 23, 42, 0.98));
	--glass-strong: rgba(17, 24, 39, 0.78);
	--glass-soft: rgba(17, 24, 39, 0.9);
	--nav-bg: rgba(17, 24, 39, 0.75);
	--surface-soft: rgba(148, 163, 184, 0.12);
	--border-soft: rgba(148, 163, 184, 0.2);
	--dot-color: rgba(148, 163, 184, 0.2);
}

.account {
	min-height: 100%;
	display: grid;
	grid-template-columns: minmax(220px, 320px) minmax(0, 1fr);
	gap: 2.5rem;
	padding: 2.5rem 3rem;
	background: var(--account-bg);
}

.account::after {
	content: "";
	position: fixed;
	inset: 0;
	pointer-events: none;
	background-image: radial-gradient(var(--dot-color) 0.5px, transparent 0.5px);
	background-size: 24px 24px;
	opacity: 0.35;
}

.side {
	position: sticky;
	top: 1.5rem;
	align-self: start;
	display: flex;
	flex-direction: column;
	gap: 2rem;
	font-family: 'GSans', 'NotoSans', sans-serif;
}

.side-header h1 {
	margin: 0.5rem 0 0.2rem 0;
	font-size: 2.6rem;
	color: var(--title-color);
}

.eyebrow {
	text-transform: uppercase;
	letter-spacing: 0.35rem;
	font-size: 0.75rem;
	color: var(--text-secondary);
	margin: 0;
}

.side-sub {
	margin: 0;
	color: var(--text-secondary);
	line-height: 1.6;
}

.nav {
	display: flex;
	flex-direction: column;
	gap: 0.8rem;
}

.nav-item {
	border: 1px solid transparent;
	background: var(--nav-bg);
	border-radius: 18px;
	padding: 1rem 1.2rem;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.25rem;
	text-align: left;
	transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.nav-item:hover {
	cursor: pointer;
	transform: translateY(-2px);
	box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

.nav-item.active {
	border-color: rgba(37, 99, 235, 0.45);
	background: rgba(37, 99, 235, 0.16);
}

.nav-title {
	font-size: 1.1rem;
	font-weight: 600;
	color: var(--text-main);
}

.nav-desc {
	color: var(--text-secondary);
	font-size: 0.9rem;
}

.side-foot {
	margin-top: auto;
}

.tip-card {
	background: var(--surface-soft);
	padding: 1.2rem;
	border-radius: 18px;
	border: 1px solid var(--border-soft);
}

.tip-title {
	margin: 0 0 0.35rem 0;
	font-weight: 600;
	color: var(--text-main);
}

.tip-desc {
	margin: 0;
	color: var(--text-secondary);
	line-height: 1.5;
}

.content {
	min-width: 0;
	position: relative;
	z-index: 1;
}

.content.immersive .panel {
	background: var(--glass-soft);
}

.panel {
	background: var(--glass-strong);
	border-radius: 26px;
	padding: 2.4rem;
	box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
	border: 1px solid var(--border-soft);
	display: flex;
	flex-direction: column;
	gap: 2rem;
	min-height: 65vh;
}

.panel-full {
	padding: 0;
	background: transparent;
	border: none;
	box-shadow: none;
	min-height: unset;
}

.panel-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 1rem;
}

.panel-title {
	font-size: 2rem;
	margin: 0;
	color: var(--title-color);
}

.panel-sub {
	margin: 0.25rem 0 0 0;
	color: var(--text-secondary);
}

.pill {
	padding: 0.35rem 0.9rem;
	border-radius: 999px;
	background: rgba(37, 99, 235, 0.12);
	color: var(--text-main);
	font-size: 0.9rem;
}

.stats {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
	gap: 1rem;
}

.stat-card {
	background: var(--glass-soft);
	border-radius: 18px;
	padding: 1rem 1.2rem;
	border: 1px solid var(--border-soft);
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
}

.stat-label {
	margin: 0;
	color: var(--text-secondary);
	font-size: 0.9rem;
}

.stat-value {
	margin: 0;
	font-size: 1.4rem;
	color: var(--text-main);
	font-weight: 600;
}

.status-ok {
	color: var(--success);
}

.status-frozen {
	color: var(--error);
}

.stat-num {
	font-size: 1.6rem;
}

.section {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.section-title {
	font-size: 1.2rem;
	font-weight: 600;
	color: var(--title-color);
}

.record-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
}

.login-record {
	border-radius: 18px;
	background: var(--surface-soft);
	padding: 1rem 1.2rem;
	border: 1px solid transparent;
}

.login-record.success {
	border-color: rgba(22, 163, 74, 0.35);
}

.login-record.fail {
	border-color: rgba(220, 38, 38, 0.35);
}

.login-record h2 {
	margin: 0 0 0.35rem 0;
	font-size: 1.6rem;
	color: var(--text-main);
}

.login-record p {
	margin: 0;
	color: var(--text-secondary);
	font-size: 0.95rem;
}

.form-row {
	display: flex;
	gap: 1rem;
	flex-wrap: wrap;
}

input[type="text"],
input[type="password"] {
	flex: 1;
	min-width: 220px;
	padding: 16px 18px;
	background-color: var(--glass-soft);
	border: 1px solid var(--border-soft);
	border-radius: 14px;
	font-size: 1rem;
	color: var(--text-main);
	box-shadow: inset 0 0 0 1px transparent;
}

input:focus {
	border-color: rgba(37, 99, 235, 0.6);
	box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.5);
}

.btn {
	border: none;
	padding: 12px 28px;
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
	border-radius: 14px;
	font-weight: 600;
	height: fit-content;
}

.btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.btn:hover {
	background: var(--button-primary-hover);
}

.helper {
	margin: 0;
	color: var(--text-secondary);
	font-size: 0.9rem;
}

.helper.invalid {
	color: var(--error);
}

.chip-grid {
	display: flex;
	gap: 0.6rem;
	flex-wrap: wrap;
}

.ip-chip {
	background: var(--surface-soft);
	border: 1px solid var(--border-soft);
	padding: 0.45rem 0.9rem;
	border-radius: 999px;
	font-family: 'Bahnschrift', 'GSans', sans-serif;
}

.empty {
	margin: 0;
	color: var(--text-secondary);
	font-size: 0.95rem;
}

@media (max-width: 960px) {
	.account {
		grid-template-columns: 1fr;
		padding: 1.5rem;
	}

	.side {
		position: static;
	}

	.nav {
		flex-direction: row;
		flex-wrap: wrap;
	}

	.nav-item {
		flex: 1 1 160px;
	}

	.panel {
		padding: 1.6rem;
		min-height: unset;
	}

	.panel-header {
		flex-direction: column;
		align-items: flex-start;
	}
}

@media (max-width: 640px) {
	.account {
		padding: 1rem;
	}

	.panel-title {
		font-size: 1.6rem;
	}

	.stats {
		grid-template-columns: 1fr;
	}

	.record-grid {
		grid-template-columns: 1fr;
	}

	.nav-item {
		flex: 1 1 100%;
	}
}

.slide-in-enter-active {
	transition: all 0.4s ease;
}

.slide-in-enter-from {
	opacity: 0;
	transform: translateY(20px);
}

.slide-in-enter-to {
	opacity: 1;
	transform: translateX(0);
}

.slide-in-leave-active {
	display: none;
}
</style>
