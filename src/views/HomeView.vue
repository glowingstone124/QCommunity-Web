<script setup>
import {useRouter} from 'vue-router';

import NavBar from '@/components/NavBar.vue';
import {onMounted, ref} from "vue";

const router = useRouter();
const dialogRef = ref();

function gotoWebsite() {
	window.location.href = "https://qoriginal.vip"
}

function push(id) {
	const functionList = ["/", "/login", "/query", "/news", "/messages"];
	router.push(`${functionList[id]}`);
}

function showDialog() {
	dialogRef.value.showModal();
}

function closeDialog() {
	dialogRef.value.close();
	sessionStorage.setItem('hasSeenDialog', 'true');
}

onMounted(() => {
	//if (!sessionStorage.getItem('hasSeenDialog')) {
	//	showDialog();
	//}
});
</script>

<template>
	<dialog ref="dialogRef" class="custom-dialog">
		<div class="dialog-content">
			<h2>Quantum Original 2 新官网现已上线！</h2>
			<span>
			<button @click="gotoWebsite" class="close-btn">带我去！</button>
			<button @click="closeDialog" class="close-btn">我知道了</button>
				</span>
		</div>
	</dialog>
	<div class="home">
		<section class="hero">
			<div class="hero-copy">
				<p class="eyebrow">Quantum Original</p>
				<h1 class="hero-title">欢迎回来</h1>
				<p class="hero-sub">集中管理账号、功能与服务入口。选择模块即可开始。</p>
				<div class="hero-actions">
					<router-link to="/register" class="action primary">
						{{ $t("mainPage.register") }}
					</router-link>
					<router-link to="/query" class="action ghost">
						{{ $t("mainPage.query") }}
					</router-link>
				</div>
			</div>
			<div class="hero-card">
				<div class="stat">
					<p class="stat-label">快速入口</p>
					<p class="stat-value">{{ $t("mainPage.dashboard") }}</p>
				</div>
				<div class="stat">
					<p class="stat-label">新消息</p>
					<p class="stat-value">{{ $t("mainPage.message_list") }}</p>
				</div>
				<div class="stat">
					<p class="stat-label">资料库</p>
					<p class="stat-value">{{ $t("mainPage.miscs") }}</p>
				</div>
			</div>
		</section>

		<section class="tiles">
			<router-link to="/register" class="tile">
				<div class="tile-icon">✦</div>
				<div>
					<h2>{{ $t("mainPage.register") }}</h2>
					<p>{{ $t("mainPage_description.register") }}</p>
				</div>
			</router-link>
			<router-link to="/sponsors" class="tile">
				<div class="tile-icon">✱</div>
				<div>
					<h2>{{ $t("mainPage.greetings") }}</h2>
					<p>{{ $t("mainPage_description.greetings") }}</p>
				</div>
			</router-link>
			<router-link to="/query" class="tile">
				<div class="tile-icon">✺</div>
				<div>
					<h2>{{ $t("mainPage.query") }}</h2>
					<p>{{ $t("mainPage_description.query") }}</p>
				</div>
			</router-link>
			<router-link to="/messages" class="tile">
				<div class="tile-icon">✸</div>
				<div>
					<h2>{{ $t("mainPage.message_list") }}</h2>
					<p>{{ $t("mainPage_description.message_list") }}</p>
				</div>
			</router-link>
			<router-link to="/dashboard" class="tile">
				<div class="tile-icon">✶</div>
				<div>
					<h2>{{ $t("mainPage.dashboard") }}</h2>
					<p>{{ $t("mainPage_description.dashboard") }}</p>
				</div>
			</router-link>
			<router-link to="/transport" class="tile">
				<div class="tile-icon">✹</div>
				<div>
					<h2>{{ $t("mainPage.transport") }}</h2>
					<p>{{ $t("mainPage_description.transport") }}</p>
				</div>
			</router-link>
			<router-link to="/miscs" class="tile">
				<div class="tile-icon">✷</div>
				<div>
					<h2>{{ $t("mainPage.miscs") }}</h2>
					<p>{{ $t("mainPage_description.miscs") }}</p>
				</div>
			</router-link>
			<router-link to="/advancements" class="tile">
				<div class="tile-icon">✻</div>
				<div>
					<h2>{{ $t("mainPage.advancements") }}</h2>
					<p>{{ $t("mainPage_description.advancements") }}</p>
				</div>
			</router-link>
		</section>
	</div>
</template>


<style scoped>
@import '/src/assets/main.css';

:global(:root) {
	--home-bg:
		radial-gradient(circle at 10% 0%, rgba(37, 99, 235, 0.16), transparent 55%),
		radial-gradient(circle at 80% 10%, rgba(255, 186, 106, 0.2), transparent 45%),
		linear-gradient(160deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95));
	--home-card: rgba(255, 255, 255, 0.9);
	--home-soft: rgba(15, 23, 42, 0.05);
	--home-border: rgba(15, 23, 42, 0.12);
}

:global(:root[data-theme="dark"]) {
	--home-bg:
		radial-gradient(circle at 10% 0%, rgba(59, 130, 246, 0.15), transparent 55%),
		radial-gradient(circle at 80% 10%, rgba(244, 114, 182, 0.18), transparent 45%),
		linear-gradient(160deg, rgba(11, 18, 32, 0.98), rgba(15, 23, 42, 0.98));
	--home-card: rgba(17, 24, 39, 0.88);
	--home-soft: rgba(148, 163, 184, 0.12);
	--home-border: rgba(148, 163, 184, 0.22);
}

.home {
	min-height: 100vh;
	padding: 6rem 3rem 3rem;
	background: var(--home-bg);
	display: flex;
	flex-direction: column;
	gap: 3rem;
}

.hero {
	display: grid;
	grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.8fr);
	gap: 2rem;
	align-items: center;
}

.hero-copy {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.eyebrow {
	text-transform: uppercase;
	letter-spacing: 0.35rem;
	font-size: 0.75rem;
	color: var(--text-secondary);
	margin: 0;
}

.hero-title {
	margin: 0;
	font-size: 3.6rem;
	font-weight: 600;
	color: var(--title-color);
}

.hero-sub {
	margin: 0;
	color: var(--text-secondary);
	font-size: 1.1rem;
	line-height: 1.6;
	max-width: 520px;
}

.hero-actions {
	display: flex;
	gap: 1rem;
	flex-wrap: wrap;
}

.action {
	text-decoration: none;
	padding: 0.8rem 1.6rem;
	border-radius: 999px;
	font-weight: 600;
	border: 1px solid transparent;
}

.action.primary {
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
}

.action.primary:hover {
	background: var(--button-primary-hover);
}

.action.ghost {
	background: transparent;
	color: var(--text-main);
	border-color: var(--home-border);
}

.action.ghost:hover {
	background: var(--home-soft);
}

.hero-card {
	background: var(--home-card);
	border-radius: 24px;
	padding: 1.6rem;
	border: 1px solid var(--home-border);
	box-shadow: 0 18px 40px rgba(15, 23, 42, 0.15);
	display: grid;
	gap: 1rem;
}

.stat {
	padding: 0.9rem 1rem;
	border-radius: 16px;
	background: var(--home-soft);
}

.stat-label {
	margin: 0 0 0.35rem 0;
	font-size: 0.9rem;
	color: var(--text-secondary);
}

.stat-value {
	margin: 0;
	font-size: 1.2rem;
	font-weight: 600;
	color: var(--text-main);
}

.tiles {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 1.2rem;
}

.tile {
	background: var(--home-card);
	border-radius: 22px;
	padding: 1.4rem;
	display: flex;
	gap: 1rem;
	align-items: flex-start;
	border: 1px solid var(--home-border);
	text-decoration: none;
	color: inherit;
	box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
	transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.tile:hover {
	transform: translateY(-4px);
	box-shadow: 0 18px 32px rgba(15, 23, 42, 0.12);
	border-color: rgba(37, 99, 235, 0.4);
}

.tile-icon {
	width: 48px;
	height: 48px;
	border-radius: 16px;
	display: grid;
	place-items: center;
	background: rgba(37, 99, 235, 0.15);
	color: var(--primary);
	font-size: 1.2rem;
	font-weight: 700;
}

.tile h2 {
	font-size: 1.4rem;
	margin: 0 0 0.35rem 0;
	color: var(--title-color);
}

.tile p {
	margin: 0;
	color: var(--text-secondary);
	line-height: 1.5;
}

a {
	text-decoration: none;
}

@media (max-width: 960px) {
	.home {
		padding: 5rem 1.5rem 2.5rem;
	}

	.hero {
		grid-template-columns: 1fr;
	}

	.hero-title {
		font-size: 2.8rem;
	}
}

@media (max-width: 640px) {
	.home {
		padding: 4.5rem 1rem 2rem;
	}

	.hero-title {
		font-size: 2.2rem;
	}
}

.custom-dialog {
	border: none;
	border-radius: 15px;
	padding: 2rem;
	background: var(--home-card);
	color: var(--text-main);
	box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
	width: 50%;
}

.custom-dialog::backdrop {
	background: rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(3px);
}

.dialog-content {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	text-align: center;
}

.dialog-content h2 {
	font-size: 2rem;
	margin: 0;
	color: var(--title-color);
}

.dialog-content p {
	font-size: 1.1rem;
	margin: 0.5rem 0;
}

.close-btn {
	align-self: flex-end;
	background: var(--button-primary-bg);
	color: var(--button-primary-text);
	border: none;
	margin: 30px;
	padding: 0.8rem 1.5rem;
	border-radius: 8px;
	cursor: pointer;
	transition: background 0.3s ease;
}

.close-btn:hover {
	background: var(--button-primary-hover);
}
</style>
