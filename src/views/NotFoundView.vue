<script setup lang="ts">
import {useRouter} from "vue-router";
let route = useRouter();
function redirect() {
	route.push('/');
}
</script>

<template>
	<div class="not-found">
		<h1>这里似乎什么都没有</h1>
		<p class="description">链接可能已经失效，或者页面被移动到了新的位置。</p>
		<button type="button" class="redirect" @click="redirect">
			<span class="arrow" aria-hidden="true">←</span><span>回到首页</span>
		</button>
	</div>
</template>

<style scoped>
@import "/src/assets/base.css";
@import "/src/assets/main.css";

.not-found {
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: calc(100dvh - var(--app-header-height));
	flex-direction: column;
	text-align: center;
	padding: 2rem;
	background: radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--primary) 12%, transparent), transparent 38%);
}

h1 { margin: 0; font-size: clamp(2.4rem, 8vw, 5.5rem); line-height: 1; }
.description { max-width: 34rem; margin: 1.25rem auto 1.75rem; color: var(--text-secondary); font-size: 1.05rem; }

.redirect {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	border: 1px solid var(--button-secondary-border);
	border-radius: 999px;
	padding: 0.7rem 1.1rem;
	background: var(--button-secondary-bg);
	color: var(--button-secondary-text);
	cursor: pointer;
	font-weight: 700;
	transition: transform var(--motion-fast) var(--ease-standard), background var(--motion-fast) ease;
}

.redirect:hover { transform: translateY(-2px); background: var(--button-secondary-hover); }
.arrow { transition: transform var(--motion-fast) var(--ease-standard); }
.redirect:hover .arrow { transform: translateX(-3px); }
</style>
