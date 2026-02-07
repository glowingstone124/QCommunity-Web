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
	margin-left: 10px;
	font-size: 1.2rem;
	color: var(--title-color);
}
.avatar-item {
	width: 100px;
	text-align: center;
	background-color: var(--card-background);
	padding: 8px;
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s ease;
	border: 2px solid transparent;
}
.avatar-item:hover {
	background-color: var(--background-secondary);
}
.avatar-item.selected {
	border-color: var(--primary);
	background-color: var(--background-secondary);
}
.avatar-image {
	width: 80px;
	height: 80px;
	object-fit: cover;
	border-radius: 4px;
}

.avatar-image {
	width: 100px;
	height: 100px;
	object-fit: cover;
	border-radius: 4px;
}
.avatar-list {
	max-height: 50vh;
	overflow-y: auto;
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	padding: 10px;
	justify-content: flex-start;
}
.save-avatar-btn {
	margin: 16px;
	padding: 10px 20px;
	background-color: var(--button-primary-bg);
	color: var(--button-primary-text);
	border: none;
	border-radius: 6px;
	cursor: pointer;
	transition: background-color 0.3s;
}
.save-avatar-btn:hover {
	background-color: var(--button-primary-hover);
}

@media (max-width: 768px) {
	.avatar-list {
		justify-content: center;
		max-height: 40vh;
	}

	.avatar-item {
		width: 90px;
	}
}
</style>
