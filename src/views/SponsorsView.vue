<script setup>
import Redirect from '../components/RedirectButton.vue'
import {ref} from "vue";

const showDeclaration = ref(false);
</script>

<template>
<div class="bg">
	<h1 class="big-title">Quantum Original 2</h1>
	<h2 class="chapter">参与贡献者名单</h2>
	<p>感谢所有朋友对于Quantum Original及其他服务的贡献。<br>对于艺术作品作者，点击名字前往他们的社交平台。</p>
	<a href="https://afdian.com/a/glowingstone124" class="link">前往爱发电</a>
	<Redirect text-color="white"/>
	<button class="toggle-button" @click="showDeclaration = !showDeclaration">
		{{ showDeclaration ? "收起声明 ▲" : "查看声明 ▼" }}
	</button>
	<transition name="slide-fade">
		<div v-if="showDeclaration" class="declaration-content">
			<p>欢迎您向 Quantum Original 及其附属项目贡献资金、代码及其他资源。请注意，所有捐赠与贡献均为<strong>无偿行为。</strong><br>进行捐赠或贡献，即表示您已<strong>知晓并同意</strong>：<br>
				<strong>1.资金用途：</strong>捐赠资金可能不会全部直接用于服务器本身，而是由 Quantum Original 统一调配。<br>
				<strong>2.自愿性与不可退款：</strong>所有赞助均为自愿行为，您需自行承担相关责任，一旦捐赠，恕不退款。<br>
				<strong>3.贡献归属：</strong>我们会尽力注明代码及其他贡献资源的来源，但请您理解，所有贡献的资源归 Quantum Original 所有，而非任何个人。<br>
				<strong>4.公平性：</strong>Quantum Original 将尽力保障所有玩家的正常游戏体验，但捐赠/贡献不会赋予任何游戏特权。</p>
		</div>
	</transition>
	<span class="special" style="cursor: pointer;"><a class="name"  href="https://space.bilibili.com/152309938">苗库里</a><p class="contributor artwork">东方系列像素头像</p></span>
	<span class="special" style="cursor: pointer;"><a class="name"  href="https://space.bilibili.com/152309938">苗库里</a><img src="https://bucket.glowingstone.cn/pixel_fantasia.png" class="contributor artwork imgsrc"></span>
	<span><h3 class="name">glowingstone124</h3><p class="contributor api">QAPI3</p><p class="contributor plugin">QPlugin</p><p class="contributor web">Webs</p></span>
	<span><h3 class="name">MineCreeper2086</h3><p class="contributor plugin">QPlugin</p><p class="contributor web">Webs</p></span>
	<span><h3 class="name">Adam Gu</h3><p class="contributor api">QAPI3</p><p class="contributor web">Webs</p></span>
	<span><h3 class="name">0x0025(Code Verse)</h3><p class="contributor sponsor">Sponsor</p></span>
	<span><h3 class="name">CHJWOS_</h3><p class="contributor sponsor">Sponsor</p></span>
	<span><h3 class="name">mcjiangshi56</h3><p class="contributor sponsor">Sponsor</p></span>
	<span><h3 class="name">QiuZhi__</h3><p class="contributor sponsor">Sponsor</p></span>
</div>
</template>

<style scoped>
@import url("@/assets/main.css");
.toggle-button {
	margin-top: 10px;
	background: #355e65;
	color: #adf5db;
	border: none;
	border-radius: 18px;
	padding: 0.6rem 1.5rem;
	cursor: pointer;
	font-size: 1rem;
	transition: background 0.3s ease-in-out;
}

.toggle-button:hover {
	background: #2a4c50;
}

.slide-fade-enter-active, .slide-fade-leave-active {
	transition: max-height 0.5s ease-in-out, opacity 0.3s ease-in-out;
	overflow: hidden;
}

.slide-fade-enter-from, .slide-fade-leave-to {
	max-height: 0;
	opacity: 0;
}

.slide-fade-enter-to, .slide-fade-leave-from {
	max-height: 100%;
	opacity: 1;
}

.declaration-content {
	background: rgba(255, 255, 255, 0.1);
	padding: 15px;
	border-radius: 8px;
	color: #e4f3ec;
	max-width: 40em;
	margin-top: 10px;
}
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
.artwork {
	background-image: linear-gradient(120deg, #a6c0fe 0%, #f68084 100%);
}
.contributor {
	color: #e4f3ec;
	border-radius: 18px;
	margin: 7px;
	padding: 10px 15px;
}
.imgsrc {
	width: 130px;
}
.bg {
	background-color: #3b4444;
	height:90vh;
	padding: 3rem;
	overflow: scroll;
	width:100vw;
}
.big-title {
	font-weight: 600;
	padding-bottom: 0;
	margin-bottom: 0;
	font-size: 4.8rem;
	font-family: 'Bahnschrift', sans-serif;
}
.chapter {
	font-weight: 400;
	font-size: 2rem;
	margin-top: 5px;
}
.name {
	margin-right: 20px;
	font-family: "Bahnschrift", sans-serif;
	font-size: 1.6rem;
	text-decoration: none;

}
h1, h2,p, a {
	color: #adf5db;
}
h3 {
	color: #adf5db;
}

.special {
	background-color: #52655f;
	padding: 5px 20px;
	margin-top: 20px;
	max-width: fit-content;
	border-radius: 10px;
}
.special:hover {
	transform: translateX(20px);
	box-shadow: rgba(46, 240, 166, 0.4) -5px 5px, rgba(46, 240, 143, 0.3) -10px 10px, rgba(46, 240, 137, 0.2) -15px 15px, rgba(46, 240, 124, 0.1) -20px 20px, rgba(46, 246, 124, 0.05) -25px 25px;
}

.link {
	background: #355e65;
	color: #adf5db;
	border-radius: 18px;
	padding: 0.6rem 1.5rem;
}
</style>
