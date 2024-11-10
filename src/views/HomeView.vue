<script setup>
import {useRouter} from 'vue-router';

import PersonCard from "@/components/PersonCard.vue";

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
		<span style="display: flex;" class="content-span">
			<PersonCard />
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
			<router-link to="/dashboard" class="tile">
				<h2>仪表板</h2>
				<p>查看服务器状态。</p>
				<span class="icon-messages"></span>
			</router-link>
			<router-link to="/register" class="tile">
				<h2>注册账号</h2>
				<p>注册账号并且开始游玩</p>
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
	padding-left: 9rem;
	max-width: 100vw;
	height: 100vh;
	overflow-y: hidden;
}

h1 {
	background-image: linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%);
	font-size: 5.6rem;
	margin-top: 0;
	margin-bottom: 0;
	font-weight: 300;
	background-clip: text;
	-webkit-background-clip: text;
	color: transparent;
}


h3.greeting {
	color: var(--text);
	font-size: 1.2rem;
	font-weight: 300;
}

.tiles-container {
	display: flex;
	justify-content: left;
	flex-wrap: wrap;
	max-width: 57vw;
	margin: auto auto;
	overflow-y: auto;
	max-height: 65vh;
	flex:7;
}

.message-container {
	flex: 3;
	display: flex;
	align-items: center;
	flex-direction: column;
	justify-content: center;
}

.tile {
	background-color: rgba(121, 178, 180, 0.5);
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
	background-color: rgba(44, 161, 196, 0.43);
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
	color:  #89fff5;
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
		max-width: 60vw;
	}
	.tile {
		width:100%;
		padding: 30px;
		h2 {
			margin: 0;
		}
		min-height: unset;
	}
}
</style>
