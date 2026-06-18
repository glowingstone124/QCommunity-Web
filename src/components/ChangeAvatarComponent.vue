<template>
	<h1>
		点击来更换一个新的头像
	</h1>
	<div class="avatar-list">
		<div
			class="avatar-item"
			v-for="avatar in avatars"
			:key="avatar.id"
			:class="{ selected: avatar.id === selectedAvatarId }"
			@click="selectAvatar(avatar.id)"
		>
			<img :src="avatar.url" :alt="avatar.id" class="avatar-image" />
		</div>
	</div>
	<button class="save-avatar-btn" @click="saveAvatar">保存头像</button>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import axios from "axios"

interface Avatar {
	id: string
	url: string
}

const avatars = ref<Avatar[]>([])
const selectedAvatarId = ref<string | null>(null)

function selectAvatar(id: string) {
	selectedAvatarId.value = id
}
async function saveAvatar() {
	if (!selectedAvatarId.value) {
		alert("请先选择一个头像！");
		return;
	}
	try {
		await axios.post(
			`https://api.qoriginal.vip/qo/authorization/account/card/custom`,
			{ avatar: selectedAvatarId.value },
			{
				headers: {
					token: localStorage.getItem("token") || "",
				},
			}
		);
		alert("头像保存成功！");
	} catch (error) {
		console.error("保存头像失败", error);
		alert("保存头像失败，请稍后重试。");
	}
}


onMounted(async () => {
	try {
		const response = await axios.get<Avatar[]>("https://api.qoriginal.vip/qo/authorization/avatars/all")
		avatars.value = response.data
	} catch (error) {
		console.error("获取头像失败:", error)
	}
})
</script>

<style scoped>
h1 {
	font-size: 1rem;
	color: var(--title-color);
	margin: 0;
}
.avatar-item {
	width: 104px;
	text-align: center;
	background-color: var(--glass-soft);
	padding: 8px;
	border-radius: 0;
	cursor: pointer;
	transition:
		background-color 0.18s ease,
		border-color 0.18s ease;
	border: 1px solid var(--border-soft);
}
.avatar-item:hover {
	background-color: var(--surface-soft);
}
.avatar-item.selected {
	border-color: var(--primary);
	background-color: color-mix(in srgb, var(--primary) 10%, transparent);
}

.avatar-image {
	width: 100%;
	aspect-ratio: 1;
	height: auto;
	object-fit: cover;
	border-radius: 0;
}
.avatar-list {
	max-height: 52vh;
	overflow-y: auto;
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
	gap: 10px;
	padding: 0.25rem 0;
	align-items: start;
}
.save-avatar-btn {
	margin: 0;
	padding: 0.78rem 1.25rem;
	background-color: var(--button-primary-bg);
	color: var(--button-primary-text);
	border: 1px solid var(--primary);
	border-radius: 0;
	cursor: pointer;
	transition: background-color 0.18s ease;
	width: fit-content;
}
.save-avatar-btn:hover {
	background-color: var(--button-primary-hover);
}

@media (max-width: 768px) {
	.avatar-list {
		grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
		max-height: 40vh;
	}

	.avatar-item {
		width: auto;
	}
}
</style>
