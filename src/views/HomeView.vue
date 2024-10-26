<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function push(id) {
	const functionList = ["/", "/login", "/query", "/news", "/messages"];
	router.push(`${functionList[id]}`);
}

function greeting() {
	const now = new Date();
	const hour = now.getHours();

	if (hour >= 6 && hour < 11) {
		return "早上好";
	} else if (hour >= 11 && hour < 14) {
		return "中午好";
	} else if (hour >= 14 && hour < 18) {
		return "下午好";
	} else if (hour >= 18 || hour < 6) {
		return "晚上好";
	}

	return "您好";
}
</script>

<template>
	<div class="main">
		<span class="title">
			<h1>QCommunity</h1>
			<p>beta</p>
		</span>
		<h3 class="greeting">{{ greeting() }}</h3>

		<div class="tiles-container">
			<router-link to="/query" class="tile">
				<h2>查询</h2>
				<p>查询一个用户当前的状态，或是在群里与他互动。</p>
				<span class="icon-query"></span>
			</router-link>
			<router-link to="/news" class="tile">
				<h2>新闻</h2>
				<p>浏览服务器的最新进展。</p>
				<span class="icon-news"></span>
			</router-link>
			<router-link to="/messages" class="tile">
				<h2>消息列表</h2>
				<p>查看服务器之前的聊天记录。</p>
				<span class="icon-messages"></span>
			</router-link>
		</div>
	</div>
</template>


<style scoped>
@import '/src/assets/main.css';

.main {
	padding-top: 9rem;
	padding-left: 9rem;
	max-width: 100vw;
	height: 100vh;
	overflow-y: hidden;
	background-color: #111010;
}

h1 {
	color: var(--text);
	font-size: 5.6rem;
	margin-top: 0;
	margin-bottom: 0;
	font-weight: 300;
}

h3.greeting {
	color: var(--text);
	font-size: 1.2rem;
	font-weight: 300;
}

.tiles-container {
	display: flex;
	justify-content: left;
	margin:auto;
	flex-wrap: wrap;
	max-width: 80vw;
}

.tile {
	background-color: #332f2f;
	padding: 2rem;
	min-width: 15vw;
	max-width: 35vw;
	min-height: 18vh;
	margin: 30px;
	border-radius: 20px;
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
	background-color: #354d69;
	box-shadow: 0 4px 6px rgba(0,0,0,.1);
}

.icon-home,
.icon-login,
.icon-query,
.icon-news,
.icon-messages {
	display: inline-block;
	margin-top: .5rem;
}
a {
	text-decoration: none;
	color: var(--text);
}
.title {
	display: flex;
	p {
		color: var(--text);
	}
}
</style>
