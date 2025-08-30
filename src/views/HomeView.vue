<script setup>
import {useRouter} from 'vue-router';

import NavBar from '@/components/NavBar.vue';
import {onMounted, ref} from "vue";

const router = useRouter();
const dialogRef = ref(null);

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
	if (!sessionStorage.getItem('hasSeenDialog')) {
		showDialog();
	}
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
	<div class="main">
		<span style="display: flex; flex: 2" class="content-span">
		<div class="tiles-container">
      <router-link to="/register" class="tile">
				<h2>{{ $t("mainPage.register") }}</h2>
				<p>{{ $t("mainPage_description.register") }}</p>
				<span class="icon-messages"></span>
			</router-link>
			<router-link to="/sponsors" class="tile">
				<h2>{{ $t("mainPage.greetings") }}</h2>
				<p>{{ $t("mainPage_description.greetings") }}</p>
				<span class="icon-query"></span>
			</router-link>
			<router-link to="/query" class="tile">
				<h2>{{ $t("mainPage.query") }}</h2>
				<p>{{ $t("mainPage_description.query") }}</p>
				<span class="icon-query"></span>
			</router-link>
			<router-link to="/messages" class="tile">
				<h2>{{ $t("mainPage.message_list") }}</h2>
				<p>{{ $t("mainPage_description.message_list") }}</p>
				<span class="icon-messages"></span>
			</router-link>
			<router-link to="/dashboard" class="tile">
				<h2>{{ $t("mainPage.dashboard") }}</h2>
				<p>{{ $t("mainPage_description.dashboard") }}</p>
				<span class="icon-messages"></span>
			</router-link>
      <router-link to="/transport" class="tile">
				<h2>{{ $t("mainPage.transport") }}</h2>
				<p>{{ $t("mainPage_description.transport") }}</p>
				<span class="icon-messages"></span>
			</router-link>
      <router-link to="/miscs" class="tile">
				<h2>{{ $t("mainPage.miscs") }}</h2>
				<p>{{ $t("mainPage_description.miscs") }}</p>
				<span class="icon-messages"></span>
			</router-link>
			<router-link to="/advancements" class="tile">
			<h2>{{ $t("mainPage.advancements") }}</h2>
				<p>{{ $t("mainPage_description.advancements") }}</p>
				<span class="icon-messages"></span>
			</router-link>
		</div>
		</span>
	</div>
</template>


<style scoped>
@import '/src/assets/main.css';

.main {
	padding-top: 6rem;
	max-width: 100vw;
	height: 100vh;
	overflow-y: hidden;
	background-color: #587958;
}

h1 {
	background: #fefffe;
	font-size: 5.6rem;
	margin-top: 0;
	margin-bottom: 0;
	font-weight: 300;
	background-clip: text;
	-webkit-background-clip: text;
	color: transparent;
}

.tiles-container {
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	max-width: 100vw;
	margin: auto auto;
	overflow-y: auto;
	max-height: calc(100vh - 60px);
	flex: 6;
	padding-bottom: 2rem;
}

.tile {
	background-color: #183d23;
	padding: 2rem;
	min-width: 300px;
	max-width: 35vw;
	min-height: 18vh;
	margin: 10px;
	text-align: left;
	cursor: pointer;
	transition: all .3s ease-in-out;
	width: calc(20% - 1rem);

	h2 {
		font-size: 3rem;
		font-weight: 600;
	}
}

.tile:hover {
	background-color: #617c5d;
	box-shadow: 0 4px 6px rgba(0, 0, 0, .1);
}

.icon-query,
.icon-news,
.icon-messages {
	display: inline-block;
	margin-top: .5rem;
}

a {
	text-decoration: none;
	color: #d4e7a9;
}

.title {
	display: flex;
	margin-left: 10px;

	p {
		color: var(--text);
	}
}

@media (max-width: 480px) {
	.main {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		padding-left: 0rem;
	}

	.greeting {
		margin-left: 10px;
	}

	.content-span {
		flex-direction: column;
		max-width: 75vw;
		margin: auto auto;
	}

	h1 {
		font-size: 3rem;
	}

	.tiles-container {
		max-height: none;
		overflow-y: visible;
		justify-content: center;
		margin-bottom: 3vh;
	}

	.tile {
		width: 100%;
		padding: 30px;

		h2 {
			margin: 0;
		}

		min-height: unset;
	}
}

.custom-dialog {
	border: none;
	border-radius: 15px;
	padding: 2rem;
	background: #2c3e50;
	color: #fff;
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
	color: #d4e7a9;
}

.dialog-content p {
	font-size: 1.1rem;
	margin: 0.5rem 0;
}

.close-btn {
	align-self: flex-end;
	background: #587958;
	color: white;
	border: none;
	margin: 30px;
	padding: 0.8rem 1.5rem;
	border-radius: 8px;
	cursor: pointer;
	transition: background 0.3s ease;
}

.close-btn:hover {
	background: #6b9e6b;
}
</style>
