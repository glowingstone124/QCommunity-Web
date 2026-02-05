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
			`https://api.qoriginal.vip/qo/advancement/completed?name=${username}`
		);
		if (!completedResponse.ok)
			throw new Error(`请求 /completed 失败: ${completedResponse.status}`);
		const completedData: Advancement[] = await completedResponse.json();
		completedAdvancementList.value = completedData;

		const allResponse = await fetch("https://api.qoriginal.vip/qo/advancement/all");
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
		const res = await fetch("https://api.qoriginal.vip/qo/authorization/account", {
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
	<div class="advancement-page" v-if="loginstat">
		<header class="page-header">
			<div>
				<p class="eyebrow">成就中心</p>
				<h1>您正在作为 {{ username }} 登录</h1>
				<p class="sub">查看进度、规划目标、解锁更多成就。</p>
			</div>
			<div class="stats">
				<div class="stat">
					<span class="stat-label">已完成</span>
					<span class="stat-value">{{ completedAdvancementList.length }}</span>
				</div>
				<div class="stat">
					<span class="stat-label">未完成</span>
					<span class="stat-value">{{ pendingAdvancementList.length }}</span>
				</div>
			</div>
		</header>

		<section class="section">
			<div class="section-head">
				<h2>未完成的成就</h2>
				<span class="count">{{ pendingAdvancementList.length }}</span>
			</div>
			<div class="card-grid" v-if="pendingAdvancementList.length">
				<AdvancementCard
					v-for="adv in pendingAdvancementList"
					:key="adv.id"
					:advancement="adv"
					status="pending"
				/>
			</div>
			<p v-else class="empty">当前没有未完成的成就。</p>
		</section>

		<section class="section">
			<div class="section-head">
				<h2>已完成的成就</h2>
				<span class="count">{{ completedAdvancementList.length }}</span>
			</div>
			<div class="card-grid" v-if="completedAdvancementList.length">
				<AdvancementCard
					v-for="adv in completedAdvancementList"
					:key="adv.id"
					:advancement="adv"
					status="completed"
				/>
			</div>
			<p v-else class="empty">暂无已完成的成就。</p>
		</section>
	</div>
	<div v-else class="hint-container">
		<div class="hint-card">
			<h1>使用此功能之前需要登录</h1>
			<p>登录后即可查看成就进度与历史记录。</p>
		</div>
	</div>
</template>

<style scoped>
.advancement-page {
	min-height: calc(100vh - 60px);
	padding: var(--page-padding);
	max-width: var(--page-max-width);
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	gap: 2rem;
}

.page-header {
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1.5rem;
	padding: 1.5rem 1.75rem;
	border-radius: var(--radius-lg);
	background: var(--background-secondary);
	box-shadow: var(--shadow-soft);
}

.page-header h1 {
	margin: 0.3rem 0 0;
	font-size: 2rem;
	color: var(--title-color);
	font-family: 'Bahnschrift', 'Inter', sans-serif;
}

.eyebrow {
	margin: 0;
	font-size: 0.75rem;
	letter-spacing: 0.28rem;
	text-transform: uppercase;
	color: var(--text-secondary);
}

.sub {
	margin: 0.6rem 0 0;
	color: var(--text-secondary);
}

.stats {
	display: flex;
	gap: 1rem;
}

.stat {
	min-width: 120px;
	padding: 0.8rem 1rem;
	border-radius: var(--radius-md);
	background: var(--card-background);
	border: 1px solid var(--split);
	text-align: right;
}

.stat-label {
	display: block;
	font-size: 0.8rem;
	color: var(--text-secondary);
}

.stat-value {
	display: block;
	font-size: 1.6rem;
	font-weight: 600;
	color: var(--title-color);
}

.section {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.section-head h2 {
	margin: 0;
	font-size: 1.4rem;
	color: var(--title-color);
	font-family: 'Bahnschrift', 'Inter', sans-serif;
}

.count {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 40px;
	padding: 0.2rem 0.6rem;
	border-radius: 999px;
	background: var(--primary-light);
	color: var(--button-primary-text);
	font-weight: 600;
}

.card-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	gap: 1rem;
}

.empty {
	margin: 0;
	padding: 1rem 1.2rem;
	border-radius: var(--radius-md);
	background: var(--background-secondary);
	color: var(--text-secondary);
	border: 1px dashed var(--split);
}

.hint-container {
	min-height: calc(100vh - 60px);
	display: flex;
	justify-content: center;
	align-items: center;
	padding: var(--page-padding);
}

.hint-card {
	max-width: 460px;
	text-align: center;
	padding: 2rem;
	border-radius: var(--radius-lg);
	background: var(--background-secondary);
	box-shadow: var(--shadow-soft);
}

.hint-card h1 {
	margin: 0 0 0.5rem;
	color: var(--title-color);
	font-size: 1.8rem;
	font-family: 'Bahnschrift', 'Inter', sans-serif;
}

.hint-card p {
	margin: 0;
	color: var(--text-secondary);
}

@media (max-width: 720px) {
	.page-header {
		padding: 1.2rem;
	}

	.page-header h1 {
		font-size: 1.6rem;
	}

	.stats {
		width: 100%;
		justify-content: space-between;
	}

	.stat {
		flex: 1;
	}
}
</style>
