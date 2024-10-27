<script setup lang="ts">
import {useRouter} from "vue-router";
let route = useRouter();
function redirect() {
	route.push('/');
}
</script>

<template>
	<div class="not-found">
		<h1>404 Not Found</h1>
		<span class="redirect" @click=redirect>
			<p class="arrow"><</p> <p>回到首页</p>
		</span>
	</div>
</template>

<style scoped>
@import "/src/assets/base.css";
@import "/src/assets/main.css";

.not-found {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
	flex-direction: column;
	text-align: center;
}

h1, p {
	color: var(--text);
}

.redirect {
	display: flex;
	align-items: center;
	flex-direction: row;
	cursor: pointer;
}

.redirect:hover .arrow {
	margin-right: 10px;
	transition: margin-right 0.2s;
}

.arrow {
	margin-right: 4px;
	transition: margin-right 0.2s;
}
</style>
