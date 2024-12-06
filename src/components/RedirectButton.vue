<template>
	<div class="redirect" @click="handleRedirect">
		<p class="arrow" :style="{ color: textColor }">&lt;</p>
		<p :style="{ color: textColor }">{{ label }}</p>
	</div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { ref, toRefs, defineProps } from "vue";

defineProps({
	textColor: {
		type: String,
		default: "#000"
	}
});

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
