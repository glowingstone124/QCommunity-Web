<template>
	<main class="card-page">
		<div style="position:absolute; left:-9999px; top:-9999px;">
			<ArtCardForQueryUsage
				:username="username"
				:scale="1"
				@ready="generateImage"
			/>
		</div>

		<div v-if="cardImage" class="card-preview">
			<img :src="cardImage" :alt="`${username} 的用户卡片`" />
		</div>
		<div v-else class="card-loading" role="status">
			<span class="spinner" aria-hidden="true"></span>
			<p>正在生成 {{ username }} 的用户卡片…</p>
		</div>
	</main>
</template>


<script setup lang="ts">
import { ref } from 'vue';
import ArtCardForQueryUsage from '@/components/ArtCardForQueryUsage.vue';
import html2canvas from 'html2canvas';

const props = defineProps<{ username?: string }>();
const username = props.username || 'glowingstone124';
const cardImage = ref<string | null>(null);

function generateImage() {
	const el = document.querySelector('.wrapper') as HTMLElement;
	if (!el) return;

	html2canvas(el, {  useCORS: true, backgroundColor: null }).then(canvas => {
		cardImage.value = canvas.toDataURL('image/png');
	});
	setTimeout(async function () {
		await downloadCard();
	}, 0);
}

async function downloadCard() {
	const el = document.querySelector('.wrapper') as HTMLElement;
	if (!el) return;

	const canvas = await html2canvas(el, { useCORS: true, backgroundColor: null });
	const dataUrl = canvas.toDataURL('image/png');

	const a = document.createElement('a');
	a.href = dataUrl;
	a.download = `card.png`;
	a.click();
}

</script>

<style scoped>
.card-page { min-height: 100dvh; display: grid; place-items: center; padding: clamp(1rem, 4vw, 3rem); background: var(--page-background); }
.card-preview { width: min(100%, 1100px); animation: card-in var(--motion-slow) var(--ease-standard) both; }
.card-preview img { display: block; width: 100%; height: auto; border-radius: var(--radius-panel); }
.card-loading { display: flex; align-items: center; gap: 0.8rem; color: var(--text-secondary); }
.spinner { width: 22px; height: 22px; border: 2px solid var(--split); border-top-color: var(--primary); border-radius: 50%; animation: card-spin 800ms linear infinite; }
@keyframes card-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
@keyframes card-spin { to { transform: rotate(360deg); } }
</style>
