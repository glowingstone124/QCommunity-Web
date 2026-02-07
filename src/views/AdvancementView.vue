<script setup lang="ts">
import { onMounted, ref, Ref, watch } from "vue";
import AdvancementCard from "@/components/AdvancementComponent.vue";

interface Advancement {
	id: number;
	name: string;
	description: string;
}

const fullAdvancementList: Ref<Advancement[]> = ref([]);
const completedAdvancementList: Ref<Advancement[]> = ref([]);
const pendingAdvancementList: Ref<Advancement[]> = ref([]);
const username = localStorage.getItem("username");
const loginstat = ref(false);

const fetchAdvancements = async () => {
	try {
		const completedResponse = await fetch(
			`/api/qo/advancement/completed?name=${username}`
		);
		if (!completedResponse.ok)
			throw new Error(`请求 /completed 失败: ${completedResponse.status}`);
		const completedData: Advancement[] = await completedResponse.json();
		completedAdvancementList.value = completedData;

		const allResponse = await fetch("/api/qo/advancement/all");
		if (!allResponse.ok)
			throw new Error(`请求 /all失败: ${allResponse.status}`);
		const allData: Advancement[] = await allResponse.json();
		fullAdvancementList.value = allData;

		const completedIds = completedData.map((a) => a.id);
		pendingAdvancementList.value = allData.filter(
			(adv) => !completedIds.includes(adv.id)
		);
	} catch (error) {
		console.error("加载成就失败:", error);
	}
};

onMounted(async () => {
	const token = localStorage.getItem("token");
	try {
		const res = await fetch("/api/qo/authorization/account", {
			headers: { token }
		});
		const data = await res.json();
		loginstat.value = !(data.error === 1 || data.error === 3);
	} catch (err) {
		loginstat.value = false;
		console.error("登录检查失败", err);
	}
});

watch(loginstat, (val) => {
	if (val) {
		fetchAdvancements();
	}
});
</script>

<template>
	<div class="content-container" v-if="loginstat">
		<h1>您正在作为{{ username }} 登录。</h1>
		<h2>未完成的成就</h2>
		<AdvancementCard
			v-for="adv in pendingAdvancementList"
			:key="adv.id"
			:advancement="adv"
			status="pending"
		/>

		<h2>已完成的成就</h2>
		<AdvancementCard
			v-for="adv in completedAdvancementList"
			:key="adv.id"
			:advancement="adv"
			status="completed"
		/>
	</div>
	<div v-else class="hint-container">
		<h1>使用此功能之前需要登录。</h1>
	</div>
</template>

<style scoped>
h2 {
	margin-top: 1rem;
}
h1, h2, p{
	color: white;
	font-family: 'Bahnschrift', sans-serif;
}

.content-container {
	scroll-behavior: smooth;
	overflow-y: auto;
	height: 90vh;
	padding: 2rem;
}
.hint-container {
	display: flex;
	justify-content: center;
	align-items: center;
}
</style>
