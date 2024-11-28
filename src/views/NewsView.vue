<script setup>
import { ref } from 'vue';
import Redirect from '@/components/RedirectButton.vue';
const domains = ref(['qoriginal.vip', 'prox0.qoriginal.vip', 'prox1.qoriginal.vip']);

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

h1, h2,p {
	color: #d4e7a9;
}
.container {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
	max-width: 50vw;
	margin: 0 auto;
	padding: 20px;
	background-color: #587958;
	border-radius: 8px;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.column {
	flex: 1;
	padding: 0 10px;
}

.domain-item {
	padding: 20px 24px;
	margin: 8px 0;
	background-color: #183d23;
	border-radius: 30px;
	font-size: 16px;
	color: #333;
	cursor: pointer;
	transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.domain-item:hover {
	background-color: #388d51;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

</style>
