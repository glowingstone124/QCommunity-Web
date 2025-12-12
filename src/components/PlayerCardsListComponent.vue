<script setup lang="ts">
import { ref, computed } from "vue"
import ArtCard from "@/components/ArtCard.vue"
import AllCardsComponent from "@/components/AllCardsComponent.vue"
import MyCardsComponent from "@/components/MyCardsComponent.vue";
import ChangeAvatarComponent from "@/components/ChangeAvatarComponent.vue";

const selectedIndex = ref<0 | 1>(0)

const selectModule = ref(0)

const componentsList = [AllCardsComponent, MyCardsComponent]

const currentComponent = computed(() => componentsList[selectedIndex.value])

const isCollapsed = ref(false)

function toggleCollapse() {
	isCollapsed.value = !isCollapsed.value
}

</script>

<template>
	<div class="container">
		<div class="left">
				<h1>您的卡面</h1>
			<ArtCard :scale="0.6" id="1" />
		</div>
		<div class="right" :class="{ collapsed: isCollapsed }"  v-if="!isCollapsed">
			<div class="customizationSelect">
				<div class="customizationBtn" @click="selectModule = 0"><p>卡面</p></div>
				<div class="customizationBtn" @click="selectModule = 1"><p>头像</p></div>
			</div>
			<div v-show="selectModule === 0" class="customizationFatherContainer">
				<div class="btn-group">
					<button :class="{ active: selectedIndex === 0 }" @click="selectedIndex = 0">
						所有卡片
					</button>
					<button :class="{ active: selectedIndex === 1 }" @click="selectedIndex = 1">
						我的卡片
					</button>
				</div>
				<component :is="currentComponent"/>
			</div>
			<div v-show="selectModule === 1">
				<div class="avatar-edit">
					<ChangeAvatarComponent />
				</div>
			</div>
		</div>

	</div>
</template>

<style scoped>
.customizationFatherContainer{
	max-height: calc(100vh - 100px);
	overflow: auto;
}
.customizationSelect{
	background-color: #6f747c;
	box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
	display: flex;
	justify-content: center;
	border:none;
}
.customizationBtn{
	background-color: #7b8388;
	margin: 5px;
	width:100%;
	align-content: center;
	padding: 14px;
}
.customizationBtn:hover{
	background-color: #535a5d;
}
.container {
	display: flex;
	height: 100%;
    margin-left: 4rem;
	p {
		color: #cad7ca;
		margin: auto;
		text-align: center;
	}
}
.left {
	flex: 0;
	h1 {
    display: inline-block;
		font-size: 3rem;
		color: #a9d4e7;
	}
}
.right {
	background: #343f49;
	flex: 6;
}
.btn-group {
	display: flex;
	margin-left: 5px;
	width: fit-content;
	border-radius: 4px;
	background: #223c5b;
	padding: 4px;
	overflow: hidden;
}

.btn-group button {
	position: relative;
	z-index: 1;
	padding: 8px 16px;
	background: transparent;
	color: #9faece;
	font-weight: bold;
	border: none;
	cursor: pointer;
	border-radius: 4px;
	transition: color 0.3s;
	width: 100px;
}

.btn-group button.active {
	background: #4f7391;
}

.highlight-bar {
	position: absolute;
	width: 100px;
	height: 32px;
	background-color: #46779f;
	border-radius: 4px;
	z-index: 0;
	transition: left 0.3s ease;
}

.right {
	flex: 1;
	position: relative;
	transition: all 0.3s ease;
}

.right.collapsed {
	width: 120px;
	overflow: hidden;
}

.toggle-btn {
	position: absolute;
	bottom: 10px;
	right: 10px;
	background: #3e5d3e;
	color: white;
	border: none;
	border-radius: 4px;
	padding: 6px 10px;
	cursor: pointer;
	font-size: 0.9rem;
	transition: background 0.3s;
}
.toggle-btn:hover {
	background: #4b744b;
}


</style>
