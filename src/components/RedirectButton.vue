<template>
	<div class="redirect" @click="handleRedirect">
		<p class="arrow">&lt;</p>
		<p>{{ label }}</p>
	</div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { ref } from "vue";

const label = ref("回到首页");

const router = useRouter();

function handleRedirect() {
	router.push("/");
}
</script>

<style scoped>
.redirect {
	display: flex;
	align-items: center;
	cursor: pointer;
	margin-top: 20px;
}

.arrow {
	margin-right: 8px;
	transition: margin-right 0.2s;
}

.redirect:hover .arrow {
	margin-right: 12px;
}
</style>
