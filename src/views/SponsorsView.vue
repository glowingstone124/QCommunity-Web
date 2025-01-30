<script setup>
import Redirect from '../components/RedirectButton.vue'
</script>

<template>
<div class="bg">
	<h1 class="big-title">Quantum Original</h1>
	<h2 class="chapter">参与贡献者名单</h2>
	<p>感谢所有朋友对于Quantum Original及其他服务的贡献。</p>
	<a href="https://afdian.com/a/glowingstone124" class="link">前往爱发电</a>
	<Redirect text-color="white"/>
	<span><h3 class="name">glowingstone124</h3><p class="contributor api">QAPI3</p><p class="contributor plugin">QPlugin</p><p class="contributor web">Webs</p></span>
	<span><h3 class="name">Minecreeper2086</h3><p class="contributor plugin">QPlugin</p><p class="contributor web">Webs</p></span>
	<span><h3 class="name">Adam Gu</h3><p class="contributor api">QAPI3</p><p class="contributor web">Webs</p></span>
	<span><h3 class="name">0x0025(Code Verse)</h3><p class="contributor sponsor">Sponsor</p></span>
	<span><h3 class="name">QiuZhi__</h3><p class="contributor sponsor">Sponsor</p></span>
</div>
</template>

<style scoped>
@import url("@/assets/main.css");
span {
	display: flex;
	align-items: center;
}
.sponsor {
	background: #a42525;
}
.web{
	background: #7e548f;
}
.api {
	background: #1b8fa2;
}
.plugin {
	background: #8eb91e;
}
.contributor {
	color: #e4f3ec;
	border-radius: 18px;
	margin: 7px;
	padding: 10px 15px;
}
.bg {
	background-color: #3b4444;
	height:100vh;
	padding: 3rem;
	width:100vw;
}
.big-title {
	font-weight: 600;
	font-size: 4rem;
}
.chapter {
	font-weight: 400;
	font-size: 2rem;
}
.name {
	margin-right: 20px;
	font-family: "Bahnschrift", sans-serif;
	font-size: 1.6rem;
}
h1, h2,p {
	color: #adf5db;
}
h3 {
	color: #adf5db;
}
.link {
	background: #355e65;
	color: #adf5db;
	border-radius: 18px;
	padding: 0.6rem 1.5rem;
}
</style>
