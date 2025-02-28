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
				<h2>注册账号</h2>
				<p>注册账号并且开始游玩</p>
				<span class="icon-messages"></span>
			</router-link>
			<router-link to="/sponsors" class="tile">
				<h2>致谢</h2>
				<p>QuantumOriginal的发展离不开社区的支持。点击前往赞助者名单</p>
				<span class="icon-query"></span>
			</router-link>
			<router-link to="/query" class="tile">
				<h2>查询</h2>
				<p>查询一个用户当前的状态，或是在群里与他互动。</p>
				<span class="icon-query"></span>
			</router-link>
			<router-link to="/news" class="tile">
				<h2>IP查询</h2>
				<p>了解当前可用ip</p>
				<span class="icon-news"></span>
			</router-link>
			<router-link to="/messages" class="tile">
				<h2>消息列表</h2>
				<p>查看服务器之前的聊天记录。</p>
				<span class="icon-messages"></span>
			</router-link>
			<router-link to="/dashboard" class="tile">
				<h2>仪表板</h2>
				<p>查看服务器状态。</p>
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


.greeting {
	color: var(--text);
	font-size: 1.2rem;
	margin: 20px 20px;
	background: #2c3e50;
	padding: 10px;
	font-weight: 300;
}

.tiles-container {
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	max-width: 100vw;
	margin: auto auto;
	overflow-y: scroll;
	flex: 6;
}

.message-container {
	flex: 3;
	display: flex;
	align-items: center;
	flex-direction: column;
	justify-content: center;
}

.tile {
	background-color: #183d23;
	padding: 2rem;
	min-width: 300px;
	max-width: 35vw;
	min-height: 18vh;
	margin: 10px;
	border-radius: 30px;
	text-align: left;
	cursor: pointer;
	transition: all .3s ease-in-out;
	width: calc(20% - 1rem);

	h2 {
		font-size: 2.5rem;
		font-weight: 300;
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
	box-shadow: 0 0 20px rgba(0,0,0,0.3);
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
