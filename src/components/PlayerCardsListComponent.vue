<script setup lang="ts">
import { ref, computed } from "vue"
import ArtCard from "@/components/ArtCard.vue"
import AllCardsComponent from "@/components/AllCardsComponent.vue"
import MyCardsComponent from "@/components/MyCardsComponent.vue";

const selectedIndex = ref<0 | 1>(0)

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
			<div class="btn-group">
				<button :class="{ active: selectedIndex === 0 }" @click="selectedIndex = 0">
					所有卡片
				</button>
				<button :class="{ active: selectedIndex === 1 }" @click="selectedIndex = 1">
					我的卡片
				</button>
			</div>
			<component :is="currentComponent" />
		</div>

	</div>
</template>

<style scoped>
.container {
	display: flex;
	height: 100%;
  margin-left: 4rem;
}
.left {
	flex: 0;
	h1 {
    display: inline-block;
		font-size: 3rem;
		color:#d4e7a9;
	}
}
.right {
  background: #545e54;
	flex: 6;
}
.btn-group {
	position: relative;
	display: flex;
	width: fit-content;
	border-radius: 4px;
	background: #1c4923;
	padding: 4px;
	overflow: hidden;
}

.btn-group button {
	position: relative;
	z-index: 1;
	padding: 8px 16px;
	background: transparent;
	color: #c7ce9f;
	font-weight: bold;
	border: none;
	cursor: pointer;
	border-radius: 4px;
	transition: color 0.3s;
	width: 100px;
}

.btn-group button.active {
	background: #67914f;
}

.highlight-bar {
	position: absolute;
	width: 100px;
	height: 32px;
	background-color: #5d9f46;
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
