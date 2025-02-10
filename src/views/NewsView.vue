<script setup>
import { ref } from 'vue';
import Redirect from '@/components/RedirectButton.vue';
const domains = ref(['qoriginal.vip', 'prox0.qoriginal.vip', 'prox1.qoriginal.vip', 'globe.qoriginal.vip']);

const copyToClipboard = (text) => {
	navigator.clipboard.writeText(text).then(() => {
		alert(`已复制: ${text}`);
	}).catch(err => {
		console.error('复制失败', err);
	});
};
</script>

<template>
	<div class="container">
		<div class="column">
			<h1>域名列表</h1>
			<h2>在这里找到所有的可用分布式连接，随便选择一个可用的来连接到QuantumOriginal，单击复制到剪切板。</h2>
			<Redirect />
		</div>

		<div class="column">
			<div
				v-for="domain in domains"
				:key="'right-' + index"
				class="domain-item"
				@click="copyToClipboard(domain)"
			>
				<p>{{ domain }}</p>
			</div>
		</div>
	</div>
</template>

<style scoped>
h1, h2, p {
	color: #d4e7a9;
}

.container {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	height: 100vh;
	width: 90%;
	margin: 0 auto;
	padding: 20px;
	background-color: #2a3a2a;
	border-radius: 8px;
}

.column {
	width: 100%;
	padding: 10px 0;
}

.domain-item {
	padding: 16px;
	margin: 8px 0;
	background-color: #394f39;
	border-radius: 30px;
	font-size: 18px;
	color: #d4e7a9;
	cursor: pointer;
	text-align: center;
	transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.domain-item:hover {
	background-color: #388d51;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
	.container {
		flex-direction: row;
		width: 70vw;
	}

	.column {
		flex: 1;
		padding: 0 10px;
	}
}
</style>
